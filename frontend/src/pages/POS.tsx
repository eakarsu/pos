import React, { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

const POS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const newTax = newSubtotal * 0.08; // 8% tax rate
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal + newTax);
  }, [cart]);

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/products/barcode/${barcode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addToCart({
            id: data.data.product.id,
            name: data.data.product.name,
            price: Number(data.data.product.price)
          });
        }
      } else {
        console.error('Product not found');
      }
      setBarcode('');
    } catch (error) {
      console.error('Error looking up product:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const saleData = {
        userId: user.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          taxRate: 8 // 8% tax rate
        })),
        payments: [{
          amount: total,
          method: 'CASH'
        }]
      };

      const response = await fetch('/api/v1/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('Sale completed:', data.data.sale);
          clearCart();
          alert('Sale completed successfully!');
        }
      } else {
        console.error('Checkout failed');
        alert('Checkout failed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      alert('Checkout failed. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Search</h2>
          
          {/* Barcode Scanner */}
          <form onSubmit={handleBarcodeSubmit} className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
          </form>

          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {['All', 'Food', 'Beverages', 'Snacks'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Add Buttons - Sample Products */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { 
                id: '1', 
                name: 'Coffee', 
                price: 3.50, 
                image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
              { 
                id: '2', 
                name: 'Sandwich', 
                price: 8.99, 
                image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '3', 
                name: 'Soda', 
                price: 2.25, 
                image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
              { 
                id: '4', 
                name: 'Chips', 
                price: 1.99, 
                image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&h=150&fit=crop&crop=center',
                category: 'Snacks'
              },
              { 
                id: '5', 
                name: 'Water', 
                price: 1.50, 
                image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
              { 
                id: '6', 
                name: 'Candy', 
                price: 0.99, 
                image: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?w=150&h=150&fit=crop&crop=center',
                category: 'Snacks'
              },
              { 
                id: '7', 
                name: 'Pizza Slice', 
                price: 4.50, 
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '8', 
                name: 'Energy Drink', 
                price: 3.25, 
                image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
              { 
                id: '9', 
                name: 'Donut', 
                price: 2.50, 
                image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '10', 
                name: 'Ice Cream', 
                price: 4.99, 
                image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '11', 
                name: 'Cookies', 
                price: 3.75, 
                image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=150&h=150&fit=crop&crop=center',
                category: 'Snacks'
              },
              { 
                id: '12', 
                name: 'Juice', 
                price: 2.99, 
                image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
              { 
                id: '13', 
                name: 'Burger', 
                price: 12.99, 
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '14', 
                name: 'Salad', 
                price: 7.50, 
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '15', 
                name: 'Muffin', 
                price: 3.25, 
                image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '16', 
                name: 'Nuts', 
                price: 4.25, 
                image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=150&h=150&fit=crop&crop=center',
                category: 'Snacks'
              },
              { 
                id: '17', 
                name: 'Yogurt', 
                price: 2.75, 
                image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '18', 
                name: 'Tea', 
                price: 2.50, 
                image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
              { 
                id: '19', 
                name: 'Croissant', 
                price: 3.99, 
                image: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5a?w=150&h=150&fit=crop&crop=center',
                category: 'Food'
              },
              { 
                id: '20', 
                name: 'Smoothie', 
                price: 5.50, 
                image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=150&h=150&fit=crop&crop=center',
                category: 'Beverages'
              },
            ].filter(product => selectedCategory === 'All' || product.category === selectedCategory).map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors text-left shadow-sm border border-gray-200 group"
              >
                <div className="aspect-square mb-2 overflow-hidden rounded-md">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/150x150/e5e7eb/6b7280?text=${encodeURIComponent(product.name)}`;
                    }}
                  />
                </div>
                <div className="font-medium text-gray-900 text-sm truncate">{product.name}</div>
                <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                <div className="text-sm font-semibold text-blue-600">${product.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600">${item.price.toFixed(2)} each</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-red-400 hover:text-red-600 ml-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="ml-4 font-medium text-gray-900">
                  ${item.total.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full mt-6 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default POS;
