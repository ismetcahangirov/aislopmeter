const testimonials = [
  { name: "Sarah Johnson", role: "CEO, TechCorp", avatar: "https://i.pravatar.cc/150?img=1", quote: "NovaFlow is a game-changer. It completely transformed the way our team works!" },
  { name: "Michael Chen", role: "Product Manager", avatar: "https://i.pravatar.cc/150?img=2", quote: "I highly recommend NovaFlow. It exceeded our expectations in every way." },
  { name: "John Doe", role: "Founder, Company Name", avatar: "https://i.pravatar.cc/150?img=3", quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
];

export default function Testimonials() {
  return (
    // Testimonials section
    <section className="py-24">
      <h2 className="text-center text-3xl font-bold">What Our Customers Say</h2>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.name} className="rounded-2xl bg-white/5 p-8">
            <img src={t.avatar} className="h-12 w-12 rounded-full" />
            <p className="mt-4">"{t.quote}"</p>
            <h4 className="mt-4 font-semibold">{t.name}</h4>
            <span className="text-sm text-gray-400">{t.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
