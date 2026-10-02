import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userEmail, total } = await request.json()
    
    const domain = process.env.MAILGUN_DOMAIN
    const apiKey = process.env.MAILGUN_API_KEY

    // Debugging: Print exactly what variables we are using
    console.log("--- STARTING EMAIL SEND ---")
    console.log("Sending to:", userEmail)
    console.log("Using Domain:", domain)

    const formData = new URLSearchParams()
    formData.append('from', `My Shop <mailgun@${domain}>`)
    formData.append('to', userEmail)
    formData.append('subject', 'Your Order Confirmation - My Shop')
    formData.append('text', `Thank you for your order! Your total was $${total}. Your items will be shipped soon.`)

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    // Debugging: Read Mailgun's exact response
    const data = await response.json()
    console.log("MAILGUN STATUS CODE:", response.status)
    console.log("MAILGUN ERROR MESSAGE:", data)
    console.log("---------------------------")

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: data }, { status: response.status })
    }
  } catch (error) {
    console.error("SERVER CRASH:", error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}