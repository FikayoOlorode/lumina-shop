'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'

export default function Checkout() {
  const router = useRouter()
  const [cart, setCart] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [address, setAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const loggedInUser = session?.user ?? null
      setUser(loggedInUser)

      if (loggedInUser) {
        // CROSS-DEVICE SYNC: Fetch cart from Supabase if logged in
        fetchCloudCart(loggedInUser.id)
      } else {
        // GUEST FALLBACK: Fetch from local storage
        const savedCart = localStorage.getItem('shop_cart')
        if (savedCart) setCart(JSON.parse(savedCart))
      }
    })
  }, [])

  async function fetchCloudCart(userId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      
    if (data && data.length > 0) {
      setCart(data)
    } else if (error) {
      console.error("Error fetching cloud cart:", error)
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0)

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault() 
    
    if (!user) {
      alert("You must be logged in to place an order!")
      return
    }

    setIsSubmitting(true)

    // Save to orders table
    const { error } = await supabase.from('orders').insert([
      {
        user_email: user.email,
        shipping_address: address,
        total_price: total,
        items: cart
      }
    ])

    if (error) {
      alert("Error placing order: " + error.message)
      setIsSubmitting(false)
      return
    }

    // Trigger Mailgun confirmation email
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userEmail: user.email, 
        total: total.toFixed(2) 
      })
    })

    // Clear local storage and cloud database cart
    localStorage.removeItem('shop_cart')
    await supabase.from('cart_items').delete().eq('user_id', user.id)

    setIsSubmitting(false)
    alert("Order placed successfully! Check your email for a confirmation.")
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* Checkout Sticky Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-200 px-6 py-4 shadow-sm mb-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Lumina Checkout
          </h1>
          <button onClick={() => router.push('/')} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            ← Back to Shop
          </button>
        </div>
      </nav>

      {/* Checkout Card */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Order Summary</h2>
          
          <div className="divide-y divide-slate-100 mb-8">
            {cart.map((item, index) => (
              <div key={index} className="py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <img src={item.image_url} alt={item.title || item.name} className="w-16 h-16 object-cover rounded-lg bg-slate-50 border border-slate-100" />
                  <span className="font-medium text-slate-800">{item.title || item.name}</span>
                </div>
                <span className="font-semibold text-slate-600">₦{item.price}</span>
              </div>
            ))}
            {cart.length === 0 && <p className="text-slate-400 py-4">Your cart is empty.</p>}
            
            <div className="py-6 flex justify-between items-center mt-2 border-t-2 border-slate-100">
              <span className="text-lg font-bold text-slate-800">Total</span>
              <span className="text-3xl font-extrabold text-indigo-600">₦{total.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={placeOrder} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Address</label>
              <textarea 
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-slate-50 text-slate-900"
                placeholder="Enter your full shipping address..."
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-lg shadow-sm"
            >
              {isSubmitting ? "Processing Order..." : "Confirm & Pay"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}