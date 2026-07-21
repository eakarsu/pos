import React from 'react';

type FAQ = { question: string; answer: string };

type Props = {
  type: 'faq';
  faqItems: FAQ[];
};

const StructuredData: React.FC<Props> = ({ type, faqItems }) => {
  if (type !== 'faq') return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
};

export default StructuredData;
