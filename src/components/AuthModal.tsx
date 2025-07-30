import React from 'react'

export default function AuthModal() {
  return (
    <div className="p-6 border rounded shadow bg-white max-w-md mx-auto mt-10">
      <h2 className="text-lg font-bold mb-4">Connexion</h2>
      <input
        type="email"
        placeholder="Email"
        className="block w-full mb-3 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Mot de passe"
        className="block w-full mb-3 p-2 border rounded"
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Se connecter
      </button>
    </div>
  )
}