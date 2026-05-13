export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log('--- EMAIL MOCK ---')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${html}`)
    console.log('------------------')
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'CRM Credible <notifications@crm-credible.com>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      console.error('Email sending failed:', error)
    }
  } catch (err) {
    console.error('Email sending error:', err)
  }
}
