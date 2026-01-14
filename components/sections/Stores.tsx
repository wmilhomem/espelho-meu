export default function Stores() {
  const stores = [
    {
      name: "Atelier Luminoso",
      description: "Experiências exclusivas de alta costura",
    },
    {
      name: "Reflections Studio",
      description: "Inovação em estilo contemporâneo",
    },
    {
      name: "Essence Gallery",
      description: "Curadoria premium de tendências",
    },
  ]

  return (
    <section className="section">
      <div className="container">
        <h2 className="headline">Lojas Parceiras</h2>
        <div className="grid grid-3">
          {stores.map((store) => (
            <div key={store.name} className="card">
              <h3>{store.name}</h3>
              <p>{store.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
