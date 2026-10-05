'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { useRouter } from 'next/navigation'

type Product = {
  id: number
  name: string
  description: string
  price: number
  image_url: string
}

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Product[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    fetchProducts()
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*')
    if (data) setProducts(data)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }
  
  async function signOut() {
    await supabase.auth.signOut()
  }

const addToCart = async (product: Product) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert("Please log in to add items to your cart");

  // Push to Supabase so the mobile app's WebSocket picks it up instantly
  const { error } = await supabase.from('cart_items').upsert({
    user_id: user.id,
    product_id: product.id,
    title: product.name,
    price: product.price,
    quantity: 1
  }, { onConflict: 'user_id,product_id' });

  if (error) console.error("Error syncing cart:", error);
};
  function goToCheckout() {
    if (cart.length === 0) {
      alert("Your cart is empty!")
      return
    }
    localStorage.setItem('shop_cart', JSON.stringify(cart))
    router.push('/checkout')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* 1. Glassmorphism Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Gradient Text Logo */}
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">
            Lumina
          </h1>
          
          <div className="flex items-center gap-4 md:gap-6">
            {/* Cart Button */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600 hidden md:block">Cart: {cart.length}</span>
              {cart.length > 0 && (
                <button 
                  onClick={goToCheckout} 
                  className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-md text-sm md:text-base"
                >
                  Checkout →
                </button>
              )}
            </div>
            
            {/* Vertical Divider */}
            <div className="w-px h-8 bg-slate-300 hidden md:block"></div>
            
            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden md:flex">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Welcome back</p>
                  <p className="text-sm font-semibold truncate max-w-[150px]">{user.email}</p>
                </div>
                <button 
                  onClick={signOut} 
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle} 
                className="bg-slate-900 text-white px-5 py-2 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-md text-sm md:text-base"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          The New Collection.
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl">
          Discover our latest premium products designed to elevate your everyday life. 
          Minimalist design meets maximum functionality.
        </p>
      </div>

      {/* 3. Modern Products Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Image Container with slight gray background for contrast */}
              <div className="bg-slate-50 rounded-xl overflow-hidden mb-5">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                <span className="text-lg font-extrabold text-indigo-600">${product.price}</span>
              </div>
              
              <p className="text-slate-500 text-sm mb-6 flex-grow">{product.description}</p>
              
              <button 
                onClick={() => addToCart(product)} 
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition-colors active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="text-slate-500 mt-4 font-medium">Loading products...</p>
          </div>
        )}
      </div>
    </main>
  )
}