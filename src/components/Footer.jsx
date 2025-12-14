import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full bg-[#0A0E12] text-white">
      {/* Main Footer Content */}
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <img
                  src="/logo-invert.png"
                  alt="ASTARI"
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
                Precision-engineered golf equipment for players who demand excellence.
                Trusted by champions worldwide.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <a
                  href="mailto:info@astari.com"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">info@astari.com</span>
                </a>
                <a
                  href="tel:+44123456789"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors duration-300"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">+44 123 456 789</span>
                </a>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">London, United Kingdom</span>
                </div>
              </div>
            </div>

            {/* Shop Column */}
            <div>
              <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">
                Shop
              </h3>
              <ul className="space-y-3">
                {['Grips', 'Bags', 'Clubs', 'Balls', 'Apparel', 'Accessories'].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">
                Company
              </h3>
              <ul className="space-y-3">
                {[
                  'About Us',
                  'Our Story',
                  'Careers',
                  'Press',
                  'Sustainability',
                  'Partners',
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">
                Support
              </h3>
              <ul className="space-y-3">
                {[
                  'Help Center',
                  'Shipping Info',
                  'Returns',
                  'Warranty',
                  'Size Guide',
                  'Contact Us',
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Media & Bottom Bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 uppercase tracking-wider">
                  Follow Us
                </span>
                <div className="flex gap-3">
                  {[
                    { icon: Instagram, href: 'https://instagram.com' },
                    { icon: Facebook, href: 'https://facebook.com' },
                    { icon: Twitter, href: 'https://twitter.com' },
                    { icon: Youtube, href: 'https://youtube.com' },
                  ].map((social, index) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-300 group"
                      >
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                      </a>
                    )
                  })}
                </div>
              </div>

              {/* Legal Links */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white transition-colors duration-300">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-white transition-colors duration-300">
                  Cookie Policy
                </a>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>© {currentYear} Astari Golf. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
