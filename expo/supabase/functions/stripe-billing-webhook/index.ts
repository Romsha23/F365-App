import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "../_shared/stripeDep.ts"
import { getStripe, getStripeWebhookSecret } from "../_shared/stripeClient.ts"
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "../_shared/webhookHandlers.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return String(error)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const signature = req.headers.get("stripe-signature")
    if (!signature) throw new Error("Missing stripe-signature header")

    const body = await req.text()
    const stripe = getStripe()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      getStripeWebhookSecret()
    )

    const handlerErrors: string[] = []

    const run = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn()
      } catch (err) {
        const msg = `${label}: ${errorMessage(err)}`
        console.error("[stripe-billing-webhook]", msg)
        handlerErrors.push(msg)
      }
    }

    switch (event.type) {
      case "checkout.session.completed":
        await run("checkout.session.completed", () =>
          handleCheckoutSessionCompleted(
            stripe,
            event.data.object as Stripe.Checkout.Session
          )
        )
        break
      case "customer.subscription.updated":
        await run("customer.subscription.updated", () =>
          handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        )
        break
      case "customer.subscription.deleted":
        await run("customer.subscription.deleted", () =>
          handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        )
        break
      case "invoice.paid":
        await run("invoice.paid", () =>
          handleInvoicePaid(stripe, event.data.object as Stripe.Invoice)
        )
        break
      case "invoice.payment_failed":
        await run("invoice.payment_failed", () =>
          handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        )
        break
      case "invoice.payment_succeeded":
        await run("invoice.payment_succeeded", () =>
          handleInvoicePaid(stripe, event.data.object as Stripe.Invoice)
        )
        break
      case "customer.subscription.created":
        await run("customer.subscription.created", () =>
          handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        )
        break
      default:
        console.log(`[stripe-billing-webhook] Unhandled event type: ${event.type}`)
    }

    if (handlerErrors.length > 0) {
      return new Response(
        JSON.stringify({ received: true, errors: handlerErrors }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      )
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    const message = errorMessage(error)
    console.error("[stripe-billing-webhook]", message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
