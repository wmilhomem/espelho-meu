export default function Looks() {
  const looks = [
    { id: 1, title: "Look Elegante" },
    { id: 2, title: "Look Casual" },
    { id: 3, title: "Look Premium" },
    { id: 4, title: "Look Sofisticado" },
    { id: 5, title: "Look Contemporâneo" },
    { id: 6, title: "Look Minimalista" },
  ]

  return (
    <section className="section">
      <div className="container">
        <h2 className="headline">Looks Populares</h2>
        <div className="grid grid-3">
          {looks.map((look) => (
            <div key={look.id} className="card">
              <img
                src={`/.jpg?height=300&width=300&query=${encodeURIComponent(look.title)}`}
                alt={look.title}
                style={{ width: "100%", borderRadius: "4px", marginBottom: "12px" }}
              />
              <h3>{look.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
