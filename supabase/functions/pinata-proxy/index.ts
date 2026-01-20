
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const PINATA_JWT = Deno.env.get('PINATA_JWT')
        if (!PINATA_JWT) {
            throw new Error('PINATA_JWT is not set in Edge Function secrets')
        }

        const url = new URL(req.url)
        const action = url.searchParams.get('action') // 'list' or 'upload'

        if (action === 'list') {
            const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=100', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`
                }
            })

            const data = await response.json()
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        else if (action === 'upload') {
            // For file uploads, we expect a FormData body
            // Note: Parsing FormData in Deno Edge Functions can be tricky depending on size
            // Standard fetch pass-through is often easiest

            const contentType = req.headers.get('content-type') || ''

            // Forward the request to Pinata
            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`,
                    // Don't set Content-Type here, let fetch set it with the boundary from the formData
                    ...(contentType.includes('multipart/form-data') ? { 'Content-Type': contentType } : {})
                },
                body: req.body
            })

            const data = await response.json()
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
