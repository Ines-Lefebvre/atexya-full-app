import React from 'react'
import Header from './components/Header'
import QuoteModal from './components/QuoteModal'

const App = () => {
  return (
    <div>
      <Header />
      <QuoteModal isOpen={false} onClose={() => {}} />
    </div>
  )
}

export default App