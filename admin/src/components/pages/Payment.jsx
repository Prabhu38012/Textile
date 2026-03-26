import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import catalogImg from '../../assets/photo4.jpg'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import {
  CheckCircle2,
  Package,
  Palette,
  Truck,
  Home,
  AlertCircle
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || `${API}`
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/

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

export default function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const product = state?.product

  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  // Order detail fields
  const [selectedColorNumbers, setSelectedColorNumbers] = useState('')
  const [lengthMeters, setLengthMeters] = useState('')
  const [email, setEmail] = useState('')
  const [gstNo, setGstNo] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [paymentId, setPaymentId] = useState('')

  const pricePerMeter = product?.price || 45

  const calculateSubtotal = () => {
    const length = Number(lengthMeters) || 0
    return length * pricePerMeter
  }

  const getDeliveryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (!product) return null

  const handlePay = async (e) => {
    e.preventDefault()
    setError('')

    // Validate fields
    if (!email.includes('@')) return setError('Please enter a valid email address')
    if (!phone || phone.length < 10) return setError('Please enter a valid 10-digit phone number')
    if (!gstNo) return setError('GST number is required')
    if (!GSTIN_REGEX.test(gstNo)) {
      return setError('Please enter a valid GST number (e.g. 22AAAAA0000A1Z5)')
    }

    const colorNums = selectedColorNumbers.split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
    if (colorNums.length === 0) return setError('Please enter at least one color number from the catalog')
    for (const c of colorNums) {
      const n = Number(c)
      if (isNaN(n) || n < 1 || n > 40) return setError(`Invalid color number "${c}". Enter numbers between 1-40.`)
    }

    const lengthVal = Number(String(lengthMeters).replace(/[^0-9.-]/g, ''))
    if (!lengthVal || lengthVal < 1000) return setError('Length must be at least 1000 meters')

    const total = calculateSubtotal()
    if (total <= 0) return setError('Total amount must be greater than 0')

    setProcessing(true)

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpay()
      if (!loaded) {
        setError('Failed to load Razorpay. Check your internet connection.')
        setProcessing(false)
        return
      }

      // 2. Create Razorpay order on backend
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
        description: `${product.title} — ${lengthVal}m`,
        order_id: orderData.orderId,
        prefill: { email, contact: phone },
        theme: { color: '#7b5cf1' },
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
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
            fetch(`${API}/api/send-bill`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                orderDetails: {
                  orderId: newOrderId,
                  customerName: email.split('@')[0],
                  productTitle: product.title,
                  lengthMeters: lengthVal,
                  colors: selectedColorNumbers,
                  phone: phone,
                  gstNumber: gstNo,
                  address: address || 'N/A',
                  city: '',
                  state: '',
                  pincode: '',
                  pricePerMeter,
                  subtotal: total,
                  discount: 0,
                  deliveryCharge: 0,
                  total,
                  deliveryDate: getDeliveryDate(),
                  paymentMethod: 'Razorpay',
                },
                productId: product._id || product.id,
                quantityPurchased: lengthVal,
              }),
            }).catch(console.error)

            setSuccess(true)
            setProcessing(false)
          } catch (err) {
            setError('Verification error. Please contact support.')
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
          },
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
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500 animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-800">Order Placed Successfully!</h2>
              <div className="text-sm text-slate-600">
                Order ID: <Badge className="text-base font-mono bg-teal-600">{orderId}</Badge>
              </div>
              {paymentId && (
                <div className="text-xs text-slate-500">Payment ID: {paymentId}</div>
              )}
            </div>

            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-6 space-y-3 text-left">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Product:</span>
                  <strong className="text-slate-800">{product.title}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Length:</span>
                  <strong className="text-slate-800">{lengthMeters} meters</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Colors:</span>
                  <strong className="text-slate-800">{selectedColorNumbers}</strong>
                </div>
                {gstNo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">GST Number:</span>
                    <strong className="text-slate-800">{gstNo}</strong>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-slate-300">
                  <span>Total Paid:</span>
                  <span className="text-green-600">Rs.{calculateSubtotal().toLocaleString('en-IN')}</span>
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
          {/* LEFT — PRODUCT SUMMARY */}
          <Card className="h-fit shadow-xl border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl">{product.title}</CardTitle>
              <p className="text-slate-600">{product.desc}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <img
                  src={catalogImg}
                  alt="Color Catalog"
                  onClick={() => window.open(catalogImg, '_blank')}
                  className="w-full rounded-xl cursor-pointer border-2 border-blue-200 hover:border-teal-500 transition-all"
                  title="Click to view full size"
                />
                <div className="text-sm text-teal-600 text-center mt-3 font-medium">
                  Click to view color catalog
                </div>
              </div>

              <div className="border-t pt-6">
                <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100">
                  <CardContent className="p-5 space-y-3">
                    <h4 className="font-semibold text-lg mb-4">Order Summary</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Price per meter</span>
                      <span className="font-medium">Rs.{pricePerMeter}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Length</span>
                      <span className="font-medium">{lengthMeters || 0} meters</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 border-t-2">
                      <span>Total</span>
                      <span className="text-teal-600">Rs.{calculateSubtotal().toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2 p-4 bg-teal-50 rounded-lg text-sm text-teal-800">
                <Truck className="w-5 h-5" />
                <span>Estimated Delivery: <strong>{getDeliveryDate()}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT — ORDER + PAYMENT FORM */}
          <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-br from-slate-700 via-blue-900 to-teal-900 text-white">
            <CardHeader className="pb-6 pt-8 px-8">
              <CardTitle className="text-4xl">Secure Checkout</CardTitle>
              <p className="text-teal-300 text-sm mt-1">Powered by Razorpay</p>
            </CardHeader>
            <CardContent className="pt-6 px-8 pb-8">
              <form onSubmit={handlePay} className="space-y-6">
                {/* Contact */}
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
                  <div>
                    <Label htmlFor="gstNo" className="text-white text-base">GST Number *</Label>
                    <Input
                      id="gstNo"
                      type="text"
                      value={gstNo}
                      onChange={(e) => setGstNo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                      required
                      maxLength={15}
                      pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}"
                      title="Enter a valid GST number like 22AAAAA0000A1Z5"
                      placeholder="22AAAAA0000A1Z5"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 mt-2"
                    />
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="text-xl font-semibold flex items-center gap-2 text-teal-300">
                    <Palette className="w-5 h-5" />
                    Order Details
                  </h4>
                  <div>
                    <Label htmlFor="colorNumbers" className="text-white text-base">Color Numbers (from catalog) *</Label>
                    <Input
                      id="colorNumbers"
                      value={selectedColorNumbers}
                      onChange={(e) => setSelectedColorNumbers(e.target.value)}
                      placeholder="e.g. 1, 5, 10, 25"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 mt-2"
                    />
                    <p className="text-sm text-teal-300 mt-1">View catalog on the left and enter numbers (1-40)</p>
                  </div>
                  <div>
                    <Label htmlFor="lengthMeters" className="text-white text-base">Length (meters) *</Label>
                    <Input
                      id="lengthMeters"
                      value={lengthMeters}
                      onChange={(e) => setLengthMeters(e.target.value.replace(/\D/g, ''))}
                      placeholder="Minimum 1000 meters"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 mt-2"
                    />
                    <p className="text-sm text-teal-300 mt-1">Minimum order: 1000 meters</p>
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

                {/* Razorpay Pay Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={processing || calculateSubtotal() === 0}
                    className="w-full py-6 text-xl font-bold bg-gradient-to-r from-[#7b5cf1] to-[#06b6d4] hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {processing
                      ? 'Opening Payment…'
                      : calculateSubtotal() === 0
                      ? 'Enter Length to Continue'
                      : `Pay Rs.${calculateSubtotal().toLocaleString('en-IN')} with Razorpay`}
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
