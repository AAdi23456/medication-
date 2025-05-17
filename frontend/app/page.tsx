import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-foreground">Medication Tracker</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-primary-foreground hover:underline">
              Login
            </Link>
            <Link href="/register" className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Take Control of Your Medication Routine</h2>
          <p className="text-xl text-gray-600 mb-8">
            Track your medications, receive timely reminders, and improve your health outcomes
            with our comprehensive medication adherence platform.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90">
              Get Started
            </Link>
            <Link href="/login" className="border border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary hover:bg-opacity-10">
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Schedule Management</h3>
            <p className="text-gray-600">
              Easily manage complex medication schedules with custom dosages and timing.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Timely Reminders</h3>
            <p className="text-gray-600">
              Receive notifications and sync with your Google Calendar to never miss a dose.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Track Adherence</h3>
            <p className="text-gray-600">
              Monitor your medication adherence with detailed statistics and exportable reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Medication Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 