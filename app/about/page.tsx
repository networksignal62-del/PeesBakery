"use client"

import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Heart, Leaf, Users, Award, MapPin, Clock } from 'lucide-react'
import { useSiteSettings } from '@/hooks/use-site-settings'

export default function AboutPage() {
  const settings = useSiteSettings()

  const values = [
    {
      icon: Heart,
      title: "Quality",
      description: "Fresh, quality food daily with authentic African flavors",
    },
    {
      icon: Leaf,
      title: "Fresh",
      description: "Freshly baked pastries, cakes & bread every day",
    },
    {
      icon: Users,
      title: "Service",
      description: "Reliable customer service and easy online ordering",
    },
    {
      icon: MapPin,
      title: "Local",
      description: "Deeply rooted in Freetown's culture and community",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to delivering quality, affordable, and flavorful meals",
    },
  ]

  return (
    <div className="min-h-screen bg-[#fffbf5]">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative h-[400px] bg-[#014325]">
          <div className="absolute inset-0">
            <Image
              src="/images/design-mode/team-photo.jpg"
              alt="Pee's Bakery & Restaurant team"
              fill
              className="object-cover opacity-100"
            />
          </div>
          <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-center text-green-900 bg-[rgba(255,255,255,1)] rounded-lg px-3">About Pee&apos;s Bakery & Restaurant</h1>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-[#0f1419]">Our Story</h2>
            <p className="text-lg text-[#5c6466] leading-relaxed">
              At Pee&apos;s Bakery & Restaurant, we bring the authentic taste of Sierra Leone and Africa straight to your
              table. Located at 90A Regent Road, Old School Junction, Freetown, we are committed to serving fresh,
              delicious, and homely meals every day.
            </p>
            <p className="text-lg text-[#5c6466] leading-relaxed">
              From traditional African dishes to freshly baked bread, pastries, cakes, and refreshing drinks, we cater
              to your cravings with love and excellence. Whether you&apos;re dining in, picking up, or ordering online, we
              guarantee a delightful food experience.
            </p>
            <div className="bg-[#014325] text-white p-6 rounded-xl mt-8">
              <p className="font-bold text-xl mb-2">Our Mission</p>
              <p className="leading-relaxed">
                To deliver quality, affordable, and flavorful meals that make every customer feel at home.
              </p>
            </div>
            <div className="bg-[#fd4d00] text-white p-6 rounded-xl">
              <p className="font-bold text-xl mb-2">Our Vision</p>
              <p className="leading-relaxed">
                To be the leading food and bakery brand in Sierra Leone, offering a seamless digital and walk-in
                experience.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-[#0f1419]">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-[#fffbf5] border border-[#e5e7e8] rounded-xl p-6 text-center hover:shadow-lg transition-shadow bg-background"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#014325] text-white rounded-full mb-4">
                    <value.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[#0f1419]">{value.title}</h3>
                  <p className="text-[#5c6466] leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info Cards */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-[#e5e7e8] rounded-xl p-8">
              <MapPin className="w-12 h-12 text-[#014325] mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-[#0f1419]">Visit Us</h2>
              <p className="text-[#5c6466] leading-relaxed mb-4">{settings.address}</p>
              <p className="text-[#5c6466]">
                Come experience our authentic African cuisine and fresh bakery items in a warm and welcoming atmosphere.
              </p>
            </div>

            <div className="bg-white border border-[#e5e7e8] rounded-xl p-8">
              <Clock className="w-12 h-12 text-[#014325] mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-[#0f1419]">Opening Hours</h2>
              <div className="space-y-2 text-[#5c6466]">
                <p className="font-bold text-[#014325]">{settings.opening_hours}</p>
              </div>
              <p className="text-[#5c6466] mt-4">
                Contact us if you would like to check today&apos;s availability.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#014325] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Explore our menu and discover your new favorite dish today.
            </p>
            <Link
              href="/menu"
              className="inline-block bg-[#fd4d00] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#fd4d00]/90 transition-colors"
            >
              View Menu
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
