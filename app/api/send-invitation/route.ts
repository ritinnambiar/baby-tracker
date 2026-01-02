import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, inviteUrl, babyName, inviterName } = await request.json()

    if (!email || !inviteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Resend only when the route is called
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: 'Baby Tracker <noreply@justanotherbabytracker.com>',
      to: [email],
      subject: `Invitation to track ${babyName || 'a baby'} on Baby Tracker`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #FFE4E9 0%, #E4F1FF 100%);
                border-radius: 16px;
                padding: 40px;
                margin: 20px 0;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .title {
                font-size: 28px;
                font-weight: bold;
                color: #FF6B8A;
                margin-bottom: 10px;
              }
              .subtitle {
                font-size: 16px;
                color: #666;
              }
              .content {
                background: white;
                border-radius: 12px;
                padding: 30px;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                background: #FF6B8A;
                color: white;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 24px;
                font-weight: 600;
                margin: 20px 0;
              }
              .button:hover {
                background: #E85575;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 30px;
              }
              .emoji {
                font-size: 48px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="title">Baby Tracker 👶</div>
                <div class="subtitle">You've been invited!</div>
              </div>

              <div class="content">
                <div class="emoji" style="text-align: center;">💌</div>

                <p style="font-size: 16px;">
                  <strong>${inviterName || 'Someone'}</strong> has invited you to be a caregiver for <strong>${babyName || 'their baby'}</strong> on Baby Tracker!
                </p>

                <p style="font-size: 16px;">
                  Baby Tracker helps you keep track of feeding, sleep, diapers, growth, and more. As a caregiver, you'll be able to log activities and stay updated on the baby's progress.
                </p>

                <div style="text-align: center;">
                  <a href="${inviteUrl}" class="button">
                    Accept Invitation
                  </a>
                </div>

                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${inviteUrl}" style="color: #0074FF; word-break: break-all;">${inviteUrl}</a>
                </p>
              </div>

              <div class="footer">
                <p>This invitation was sent by Baby Tracker</p>
                <p style="font-size: 12px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      // Provide helpful error message for validation errors
      const errorMessage = error.message || 'Failed to send email'
      return NextResponse.json({
        error: errorMessage,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
