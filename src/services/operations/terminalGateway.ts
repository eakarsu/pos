import Stripe from 'stripe';
import { config } from '../../config/environment';
import { OperationsError } from './errors';
import { redactProviderMetadata } from './security';

export type TerminalOutcome = 'CAPTURED' | 'ACTION_REQUIRED' | 'FAILED' | 'DISCONNECTED' | 'CANCELLED';
export type TerminalResult = {
  outcome: TerminalOutcome;
  provider: string;
  providerRef?: string;
  tokenReference?: string;
  cardBrand?: string;
  cardLast4?: string;
  errorCode?: string;
  metadata: Record<string, unknown>;
};

export interface TerminalGateway {
  verifyReader(readerId: string): Promise<{ connected: boolean; label?: string }>;
  begin(amountCents: number, currency: string, readerId: string, idempotencyKey: string, simulationOutcome?: string): Promise<TerminalResult>;
  recover(providerRef: string, readerId?: string): Promise<TerminalResult>;
  reverse(providerRef: string, idempotencyKey: string): Promise<TerminalResult>;
  refund(providerRef: string, amountCents: number, idempotencyKey: string): Promise<TerminalResult>;
}

class DisabledGateway implements TerminalGateway {
  private unavailable(): never { throw new OperationsError('Certified card-present provider is disabled', 503, 'PAYMENT_PROVIDER_DISABLED'); }
  async verifyReader(): Promise<{ connected: boolean }> { return this.unavailable(); }
  async begin(): Promise<TerminalResult> { return this.unavailable(); }
  async recover(): Promise<TerminalResult> { return this.unavailable(); }
  async reverse(): Promise<TerminalResult> { return this.unavailable(); }
  async refund(): Promise<TerminalResult> { return this.unavailable(); }
}

class SimulatorGateway implements TerminalGateway {
  async verifyReader(readerId: string) { return { connected: !readerId.includes('offline'), label: readerId }; }
  async begin(_amount: number, _currency: string, readerId: string, idempotencyKey: string, outcome = 'CAPTURED'): Promise<TerminalResult> {
    if (outcome === 'DISCONNECTED' || readerId.includes('offline')) return { outcome: 'DISCONNECTED', provider: 'simulator', errorCode: 'READER_DISCONNECTED', metadata: { readerId } };
    if (outcome === 'FAILED') return { outcome: 'FAILED', provider: 'simulator', errorCode: 'CARD_DECLINED', metadata: { readerId } };
    return { outcome: 'CAPTURED', provider: 'simulator', providerRef: `sim_pi_${idempotencyKey}`, tokenReference: `sim_tok_${idempotencyKey}`, cardBrand: 'SIMULATED', cardLast4: '4242', metadata: { readerId } };
  }
  async recover(providerRef: string): Promise<TerminalResult> { return { outcome: 'CAPTURED', provider: 'simulator', providerRef, tokenReference: `sim_tok_${providerRef}`, cardBrand: 'SIMULATED', cardLast4: '4242', metadata: {} }; }
  async reverse(providerRef: string): Promise<TerminalResult> { return { outcome: 'CANCELLED', provider: 'simulator', providerRef, metadata: {} }; }
  async refund(providerRef: string, amountCents: number): Promise<TerminalResult> { return { outcome: 'CAPTURED', provider: 'simulator', providerRef: `sim_re_${providerRef}_${amountCents}`, metadata: { originalProviderRef: providerRef, amountCents } }; }
}

class StripeTerminalGateway implements TerminalGateway {
  private stripe: Stripe;
  constructor() {
    if (!config.stripe.secretKey) throw new OperationsError('Stripe Terminal secret is not configured', 503, 'STRIPE_NOT_CONFIGURED');
    this.stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' });
  }
  async verifyReader(readerId: string) {
    const reader: any = await this.stripe.terminal.readers.retrieve(readerId);
    return { connected: reader.status === 'online', label: reader.label };
  }
  async begin(amountCents: number, currency: string, readerId: string, idempotencyKey: string): Promise<TerminalResult> {
    const reader = await this.verifyReader(readerId);
    if (!reader.connected) return { outcome: 'DISCONNECTED', provider: 'stripe-terminal', errorCode: 'READER_DISCONNECTED', metadata: { readerId } };
    const intent: any = await this.stripe.paymentIntents.create({ amount: amountCents, currency: currency.toLowerCase(), payment_method_types: ['card_present'], capture_method: 'automatic', metadata: { readerId, checkoutKey: idempotencyKey } }, { idempotencyKey });
    const processing: any = await this.stripe.terminal.readers.processPaymentIntent(readerId, { payment_intent: intent.id });
    return { outcome: 'ACTION_REQUIRED', provider: 'stripe-terminal', providerRef: intent.id, metadata: redactProviderMetadata({ readerId, paymentStatus: intent.status, readerActionStatus: processing.action?.status }) };
  }
  async recover(providerRef: string, readerId?: string): Promise<TerminalResult> {
    const intent: any = await this.stripe.paymentIntents.retrieve(providerRef, { expand: ['latest_charge'] });
    const charge: any = typeof intent.latest_charge === 'object' ? intent.latest_charge : null;
    const details = charge?.payment_method_details?.card_present;
    if (intent.status === 'succeeded') return { outcome: 'CAPTURED', provider: 'stripe-terminal', providerRef, tokenReference: details?.generated_card, cardBrand: details?.brand, cardLast4: details?.last4, metadata: { status: intent.status } };
    if (intent.status === 'canceled') return { outcome: 'CANCELLED', provider: 'stripe-terminal', providerRef, metadata: { status: intent.status } };
    if (intent.status === 'requires_payment_method' && readerId) {
      const reader: any = await this.stripe.terminal.readers.retrieve(readerId);
      if (reader.action?.status === 'in_progress') return { outcome: 'ACTION_REQUIRED', provider: 'stripe-terminal', providerRef, metadata: redactProviderMetadata({ status: intent.status, readerId, readerActionStatus: reader.action.status }) };
      const processing: any = await this.stripe.terminal.readers.processPaymentIntent(readerId, { payment_intent: providerRef });
      return { outcome: 'ACTION_REQUIRED', provider: 'stripe-terminal', providerRef, metadata: redactProviderMetadata({ status: intent.status, readerId, readerActionStatus: processing.action?.status }) };
    }
    if (intent.status === 'requires_payment_method') return { outcome: 'FAILED', provider: 'stripe-terminal', providerRef, errorCode: intent.last_payment_error?.code ?? 'PAYMENT_METHOD_FAILED', metadata: redactProviderMetadata({ status: intent.status }) };
    return { outcome: 'ACTION_REQUIRED', provider: 'stripe-terminal', providerRef, metadata: redactProviderMetadata({ status: intent.status }) };
  }
  async reverse(providerRef: string, idempotencyKey: string): Promise<TerminalResult> {
    const current: any = await this.stripe.paymentIntents.retrieve(providerRef);
    const readerId = current.metadata?.readerId;
    if (readerId) {
      try { await this.stripe.terminal.readers.cancelAction(readerId); } catch (error: any) {
        if (!['terminal_reader_no_active_action', 'resource_missing'].includes(error?.code)) throw error;
      }
    }
    const intent: any = await this.stripe.paymentIntents.cancel(providerRef, {}, { idempotencyKey });
    return { outcome: 'CANCELLED', provider: 'stripe-terminal', providerRef: intent.id, metadata: { status: intent.status } };
  }
  async refund(providerRef: string, amountCents: number, idempotencyKey: string): Promise<TerminalResult> {
    const refund: any = await this.stripe.refunds.create({ payment_intent: providerRef, amount: amountCents }, { idempotencyKey });
    return { outcome: refund.status === 'succeeded' ? 'CAPTURED' : 'ACTION_REQUIRED', provider: 'stripe-terminal', providerRef: refund.id, metadata: { status: refund.status, paymentIntent: providerRef } };
  }
}

export function terminalGateway(): TerminalGateway {
  if (config.operations.paymentProvider === 'simulator') return new SimulatorGateway();
  if (config.operations.paymentProvider === 'stripe-terminal') return new StripeTerminalGateway();
  return new DisabledGateway();
}
