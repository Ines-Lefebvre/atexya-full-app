import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import AuthModal from './AuthModal'
import { User, LogOut, Settings, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const Header: React.FC = () => {
  const { user, signOut, isAuthenticated, isBroker, isAdmin } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error('Erreur lors de la déconnexion')
    } else {
      toast.success('Déconnexion réussie')
      setShowUserMenu(false)
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center">
                <img 
                  src="/logo-atexya.png" 
                  alt="Atexya Cash" 
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling!.style.display = 'block'
                  }}
                />
                <span 
                  className="hidden text-xl font-bold text-blue-900 ml-2"
                  style={{ display: 'none' }}
                >
                  Atexya Cash
                </span>
              </a>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Offres
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
                À propos
              </a>
              <a href="#faq" className="text-gray-700 hover:text-blue-600 transition-colors">
                FAQ
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">
                Contact
              </a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">
                      {user?.courtier_name || user?.email}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {/* Profil */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.courtier_name || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-blue-600 capitalize">{user?.role}</p>
                      </div>

                      {/* Menu items */}
                      {isBroker && (
                        <a
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="inline h-4 w-4 mr-2" />
                          Dashboard
                        </a>
                      )}

                      {isAdmin && (
                        <a
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="inline h-4 w-4 mr-2" />
                          Administration
                        </a>
                      )}

                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="inline h-4 w-4 mr-2" />
                        Mon profil
                      </a>

                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Inscription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-gray-200">
          <nav className="px-4 py-2 space-y-1">
            <a href="#features" className="block py-2 text-gray-700 hover:text-blue-600">
              Offres
            </a>
            <a href="#about" className="block py-2 text-gray-700 hover:text-blue-600">
              À propos
            </a>
            <a href="#faq" className="block py-2 text-gray-700 hover:text-blue-600">
              FAQ
            </a>
            <a href="#contact" className="block py-2 text-gray-700 hover:text-blue-600">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}

export default Header

