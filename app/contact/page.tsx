"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MapPin, Phone, Clock } from "lucide-react"
import { useSiteSettings } from '@/hooks/use-site-settings'

export default function ContactPage() {
  const settings = useSiteSettings()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [whatsappDraft, setWhatsappDraft] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lines = [
      `Hello Pee's Bakery, I have a question about ${formData.subject}.`,
      formData.message,
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      formData.phone ? `Phone: ${formData.phone}` : '',
    ].filter(Boolean)
    const number = (settings.whatsapp || '+232 78 891638').replace(/\D/g, '')
    const link = `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n\n'))}`
    setWhatsappDraft(link)
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-[#0f1419]">Contact Us</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white border border-[#e5e7e8] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#014325] text-white rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg mb-2 text-[#0f1419]">Location</h2>
                  <p className="text-[#5c6466]">{settings.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7e8] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#014325] text-white rounded-lg">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg mb-2 text-[#0f1419]">Phone</h2>
                  <a href={`tel:+${(settings.phone || '+232 78 891638').replace(/\D/g, '')}`} className="text-[#5c6466] hover:text-[#014325]">
                    {settings.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e5e7e8] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#014325] text-white rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg mb-2 text-[#0f1419]">Hours</h2>
                  <div className="text-[#5c6466] space-y-1">
                    <p className="font-bold text-[#014325]">{settings.opening_hours}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="bg-white border border-[#e5e7e8] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#0f1419]">Message us on WhatsApp</h2>

            {whatsappDraft && (
              <div role="status" className="mb-6 p-4 bg-[#f0fdf4] border border-[#10b981] rounded-lg text-[#014325]">
                Your message is ready. <a href={whatsappDraft} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Open WhatsApp and press send</a> to contact us.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
                  Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium mb-2">
                  Email (optional)
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium mb-2">
                  Phone (Optional)
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                  placeholder="+232 XX XXX XXXX"
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium mb-2">
                  Subject <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium mb-2">
                  Message <span className="text-[#dc2626]">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-[#e5e7e8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014325] focus:border-transparent resize-none"
                  placeholder="Your message..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#014325] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#014325]/90 disabled:bg-[#f2f3f4] disabled:text-[#5c6466] disabled:cursor-not-allowed transition-colors"
              >
                Continue in WhatsApp
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
