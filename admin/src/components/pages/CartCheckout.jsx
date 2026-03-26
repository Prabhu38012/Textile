import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  AlertCircle,
  ShoppingCart
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || `${API}`

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CartCheckout() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const cartItems = state?.cartItems || cart

  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [paymentId, setPaymentId] = useState('')

  const calculateTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.cartQuantity, 0)

  const getDeliveryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!cartItems || cartItems.length === 0) {
    navigate('/cart')
    return null
  }

  const handlePay = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) return setError('Please enter a valid email address')
    if (!phone || phone.length < 10) return setError('Please enter a valid 10-digit phone number')

    const total = calculateTotal()
    if (total <= 0) return setError('Cart total must be greater than 0')

    setProcessing(true)

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpay()
      if (!loaded) {
        setError('Failed to load Razorpay. Check your internet connection.')
        setProcessing(false)
        return
      }

      // 2. Create Razorpay order
      const orderRes = await fetch(`${API}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        setError(orderData.error || 'Could not create payment order')
        setProcessing(false)
        return
      }

      // 3. Open Razorpay checkout popup
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prema Textile Mills',
        description: `Cart Order — ${cartItems.length} item(s)`,
        order_id: orderData.orderId,
        prefill: { email, contact: phone },
        theme: { color: '#7b5cf1' },
        handler: async (response) => {
          try {
            // 4. Verify payment
            const verifyRes = await fetch(`${API}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyData.ok) {
              setError('Payment verification failed. Contact support.')
              setProcessing(false)
              return
            }

            const newOrderId = 'PTM' + Date.now().toString().slice(-8)
            setOrderId(newOrderId)
            setPaymentId(response.razorpay_payment_id)

            // 5. Send bill email (non-blocking)
            const firstItem = cartItems[0]
            fetch(`${API}/api/send-bill`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                orderDetails: {
                  orderId: newOrderId,
                  customerName: email.split('@')[0],
                  productTitle: cartItems.map(i => i.title).join(', '),
                  lengthMeters: cartItems.reduce((s, i) => s + i.cartQuantity, 0),
                  colors: cartItems.map(i => i.selectedColors).join('; '),
                  phone: phone,
                  gstNumber: 'N/A',
                  address: 'N/A',
                  city: '',
                  state: '',
                  pincode: '',
                  pricePerMeter: firstItem?.price || 0,
                  subtotal: total,
                  discount: 0,
                  deliveryCharge: 0,
                  total,
                  deliveryDate: getDeliveryDate(),
                  paymentMethod: 'Razorpay',
                },
                isCartOrder: true,
              }),
            }).catch(console.error)

            clearCart()
            setSuccess(true)
            setProcessing(false)
          } catch (err) {
            setError('Verification error. Please contact support.')
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`)
        setProcessing(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      setError('Payment error. Please try again.')
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-gray-50 p-6">
        <Card className="max-w-3xl w-full shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-800">Order Placed Successfully!</h2>
              <div className="text-sm text-slate-600">
                Order ID: <Badge className="text-base font-mono bg-teal-600">{orderId}</Badge>
              </div>
              {paymentId && <div className="text-xs text-slate-500">Payment ID: {paymentId}</div>}
            </div>

            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-6 space-y-3 text-left">
                <div className="font-semibold mb-2">Ordered Items:</div>
                {cartItems.map((item, index) => (
                  <div key={index} className="py-2 border-b last:border-0">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">{item.title}</span>
                      <strong className="text-slate-800">Rs.{(item.price * item.cartQuantity).toLocaleString()}</strong>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.cartQuantity}m | Colors: {item.selectedColors}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-slate-300">
                  <span>Total Paid:</span>
                  <span className="text-green-600">Rs.{calculateTotal().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <Truck className="w-5 h-5" />
              <span>Estimated Delivery: <strong>{getDeliveryDate()}</strong></span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => window.print()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
              >
                <Package className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              <Button
                onClick={() => navigate('/home')}
                variant="outline"
                className="flex-1 border-2 border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-50 py-8 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT — ORDER SUMMARY */}
          <Card className="h-fit shadow-xl border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <Card key={index} className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100">
                    <CardContent className="p-4">
                      <div className="font-semibold">{item.title}</div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-slate-600">Price per meter:</span>
                        <span className="font-medium">Rs.{item.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Length:</span>
                        <span className="font-medium">{item.cartQuantity} meters</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Colors:</span>
                        <span className="font-medium">{item.selectedColors}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                        <span>Subtotal:</span>
                        <span className="text-teal-600">Rs.{(item.price * item.cartQuantity).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white border-2 border-slate-600">
                <CardContent className="p-5">
                  <div className="flex justify-between font-bold text-2xl">
                    <span>Total</span>
                    <span className="text-teal-300">Rs.{calculateTotal().toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2 p-4 bg-teal-50 rounded-lg text-sm text-teal-800">
                <Truck className="w-5 h-5" />
                <span>Estimated Delivery: <strong>{getDeliveryDate()}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT — PAYMENT FORM */}
          <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-br from-slate-700 via-blue-900 to-teal-900 text-white">
            <CardHeader className="pb-6 pt-8 px-8">
              <CardTitle className="text-4xl">Secure Checkout</CardTitle>
              <p className="text-teal-300 text-sm mt-1">Powered by Razorpay</p>
            </CardHeader>
            <CardContent className="pt-6 px-8 pb-8">
              <form onSubmit={handlePay} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-teal-300">Contact Details</h4>
                  <div>
                    <Label htmlFor="email" className="text-white text-base">Email (for receipt) *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white text-base">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 mt-2"
                    />
                  </div>
                </div>

                {error && (
                  <Card className="bg-red-500/10 border-red-400/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 text-red-300">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-full py-6 text-xl font-bold bg-gradient-to-r from-[#7b5cf1] to-[#06b6d4] hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {processing
                      ? 'Opening Payment…'
                      : `Pay Rs.${calculateTotal().toLocaleString()} with Razorpay`}
                  </Button>
                  <p className="text-center text-xs text-white/50 mt-3">
                    🔒 Secured by Razorpay — Card, UPI, Netbanking & more
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
