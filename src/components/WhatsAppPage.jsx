import './WhatsAppPage.css';

const steps = [
  {
    step: 1,
    icon: '📱',
    title: 'Send invoices to the WhatsApp number',
    desc: 'Forward or photo-capture your invoice files and send them directly to the KIXAI WhatsApp integration number.'
  },
  {
    step: 2,
    icon: '🤖',
    title: 'AI receives and stores your invoices',
    desc: 'The system automatically receives each file and adds it to your current active batch. It confirms each received invoice.'
  },
  {
    step: 3,
    icon: '💬',
    title: 'AI asks if you want to continue',
    desc: 'After each file, KIXAI replies: "Invoice received! Do you want to add more invoices or should I generate the Excel sheet now?"'
  },
  {
    step: 4,
    icon: '📤',
    title: 'Say "Generate" when ready',
    desc: 'Send a message like "Generate the Excel sheet" or "I\'m done" and KIXAI will process all collected invoices into one organized Excel report.'
  },
  {
    step: 5,
    icon: '📊',
    title: 'Receive your Excel file',
    desc: 'The generated Excel file is sent back directly to your WhatsApp — structured, formatted, and ready for review.'
  },
];

const TOOLS = [
  {
    name: 'Make.com (Recommended)',
    logo: '⚡',
    color: '#6366f1',
    desc: 'Visual automation platform. Connect WhatsApp Business via the WhatsApp Business API module, add a webhook to KIXAI, and automate the entire workflow without any code.',
    url: 'https://make.com',
    difficulty: 'Easy',
  },
  {
    name: 'n8n (Self-hosted)',
    logo: '🔧',
    color: '#ea580c',
    desc: 'Open-source workflow automation. Use the WhatsApp Business Cloud node and connect to a KIXAI webhook. Full control and privacy.',
    url: 'https://n8n.io',
    difficulty: 'Medium',
  },
  {
    name: 'Twilio + WhatsApp',
    logo: '📡',
    color: '#dc2626',
    desc: 'Twilio\'s WhatsApp Business API gives you a programmable number. Use their webhook to forward incoming messages/files to the KIXAI pipeline.',
    url: 'https://twilio.com/whatsapp',
    difficulty: 'Advanced',
  },
];

export default function WhatsAppPage() {
  return (
    <div className="wa-page fade-in">
      {/* Hero */}
      <div className="wa-hero">
        <div className="wa-hero-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        </div>
        <div>
          <h1 className="wa-hero-title">WhatsApp → KIXAI Workflow</h1>
          <p className="wa-hero-sub">Send invoices directly through WhatsApp and receive your organized Excel report — no manual uploads needed.</p>
        </div>
      </div>

      {/* How it works */}
      <section className="wa-section">
        <h2 className="wa-section-title">How It Works</h2>
        <div className="wa-steps">
          {steps.map((s, i) => (
            <div className="wa-step" key={s.step}>
              <div className="wa-step-num">{s.step}</div>
              {i < steps.length - 1 && <div className="wa-step-line" />}
              <div className="wa-step-card card">
                <div className="wa-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integration options */}
      <section className="wa-section">
        <h2 className="wa-section-title">Integration Options</h2>
        <p className="wa-section-sub">
          WhatsApp automation requires a third-party integration platform. Choose the one that best fits your needs:
        </p>
        <div className="wa-tools">
          {TOOLS.map(t => (
            <div className="wa-tool-card card" key={t.name}>
              <div className="wa-tool-header" style={{ borderTopColor: t.color }}>
                <div className="wa-tool-logo" style={{ background: t.color + '18', color: t.color }}>
                  {t.logo}
                </div>
                <div>
                  <h3 className="wa-tool-name">{t.name}</h3>
                  <span className={`badge ${t.difficulty === 'Easy' ? 'badge-green' : t.difficulty === 'Medium' ? 'badge-aqua' : 'badge-red'}`}>
                    {t.difficulty}
                  </span>
                </div>
              </div>
              <p className="wa-tool-desc">{t.desc}</p>
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm wa-tool-link">
                Learn more →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Setup steps */}
      <section className="wa-section">
        <h2 className="wa-section-title">Quick Setup Guide (Make.com)</h2>
        <div className="wa-guide card">
          {[
            ['1. Set up WhatsApp Business API', 'Apply for a WhatsApp Business Account and get a verified number from Meta Business Manager.'],
            ['2. Create a Make.com scenario', 'In Make.com, create a new scenario with a WhatsApp Business Cloud trigger for "New Message".'],
            ['3. Add a media downloader', 'When the trigger fires, add a step to download the media file (invoice image/PDF) from WhatsApp.'],
            ['4. Call the KIXAI API', 'Use an HTTP module to POST the file to your KIXAI backend endpoint, which runs the Gemini extraction.'],
            ['5. Handle the response', 'Add the extracted invoice to the batch and send a WhatsApp reply confirming receipt.'],
            ['6. Generate on command', 'Add a filter: if the message text contains "generate" or "done", trigger the Excel export and send the file back via WhatsApp.'],
          ].map(([title, desc]) => (
            <div className="wa-guide-step" key={title}>
              <div className="wa-guide-dot" />
              <div>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="wa-note">
        <span>💡</span>
        <p>The KIXAI web interface is fully functional standalone — WhatsApp integration is an optional enhancement for teams who prefer sending invoices through WhatsApp.</p>
      </div>
    </div>
  );
}
