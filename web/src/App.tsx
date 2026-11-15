// App is the main component: the top-level piece of the page.
// For now it only shows a blank dark page with a title, to prove the setup works.
function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-bg p-8 text-center">
      <h1 className="text-4xl font-bold text-text">Housing Bubble Screener</h1>
      <p className="text-muted">M0 — setup works. The 3D map comes next.</p>
    </main>
  )
}

export default App
