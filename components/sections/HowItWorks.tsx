export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Escolha",
      description: "Selecione o estilo que ressoa com você",
    },
    {
      number: "02",
      title: "Envie",
      description: "Compartilhe sua essência através da plataforma",
    },
    {
      number: "03",
      title: "Revele",
      description: "Descubra seu novo reflexo transformado",
    },
  ]

  return (
    <section className="section">
      <div className="container">
        <h2 className="headline">Como Funciona</h2>
        <div className="grid grid-3">
          {steps.map((step) => (
            <div key={step.number} className="card">
              <div style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "12px" }}>{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
