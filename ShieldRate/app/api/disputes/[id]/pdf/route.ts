import { NextRequest, NextResponse } from 'next/server'
import { generateCompliancePack } from '@/lib/pdf-generator'

/**
 * PDF Download API
 * Generates and returns the compliance pack PDF for a dispute
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id

    if (!disputeId) {
      return NextResponse.json(
        { error: 'Dispute ID is required' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfBuffer = await generateCompliancePack(disputeId)

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-pack-${disputeId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: `Failed to generate PDF: ${error.message}` },
      { status: 500 }
    )
  }
}

