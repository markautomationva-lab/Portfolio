// @ts-check
/** @type {Record<string,{nodes:Record<string,string[]>,labels:Record<string,string>}>} */
export const architectureMetadata = {
  "solara": {
    "nodes": {
      "form": [
        "input",
        "Enquiry capture",
        "Website server"
      ],
      "n8n": [
        "automation",
        "Workflow orchestration",
        "n8n"
      ],
      "airtable": [
        "database",
        "Lead persistence",
        "Airtable"
      ],
      "retell": [
        "ai",
        "Voice qualification",
        "Retell AI"
      ],
      "results": [
        "api",
        "Call analysis intake",
        "Webhook"
      ],
      "sales": [
        "communication",
        "Conditional sales alert",
        "Gmail"
      ]
    },
    "labels": {
      "form:n8n": "Enquiry payload",
      "n8n:airtable": "Lead record",
      "n8n:retell": "Consented call",
      "retell:results": "Call analysis",
      "results:airtable": "Call outcome",
      "results:sales": "Follow-up request"
    }
  },
  "hayes": {
    "nodes": {
      "chat": [
        "input",
        "Message and session input",
        "Website chat"
      ],
      "agent": [
        "automation",
        "Conversation orchestration",
        "n8n"
      ],
      "model": [
        "ai",
        "Reasoning and context",
        "OpenAI / memory"
      ],
      "rag": [
        "database",
        "Knowledge retrieval",
        "Supabase vectors"
      ],
      "property": [
        "api",
        "Structured listing queries",
        "Property tools"
      ],
      "confirm": [
        "output",
        "Viewing-request checks",
        "n8n / Supabase"
      ]
    },
    "labels": {
      "chat:agent": "Message + session",
      "agent:model": "Conversation context",
      "agent:rag": "Knowledge query",
      "agent:property": "Listing query",
      "property:confirm": "Viewing draft"
    }
  },
  "grace": {
    "nodes": {
      "caller": [
        "input",
        "Inbound conversation",
        "Voice call"
      ],
      "retell": [
        "ai",
        "Caller qualification",
        "Retell AI"
      ],
      "n8n": [
        "automation",
        "Appointment action routing",
        "n8n"
      ],
      "contact": [
        "database",
        "Caller records",
        "GoHighLevel"
      ],
      "calendar": [
        "external",
        "Survey slot lookup",
        "GoHighLevel"
      ],
      "booking": [
        "output",
        "Confirmed survey entry",
        "GoHighLevel"
      ]
    },
    "labels": {
      "caller:retell": "Caller enquiry",
      "retell:n8n": "Tool request",
      "n8n:contact": "Contact lookup / write",
      "n8n:calendar": "Availability query",
      "calendar:retell": "Available slots",
      "n8n:booking": "Confirmed details"
    }
  },
  "hvc": {
    "nodes": {
      "slack": [
        "input",
        "Conversation interface",
        "Slack"
      ],
      "auth": [
        "automation",
        "Access check",
        "n8n"
      ],
      "agent": [
        "ai",
        "Agent and tool routing",
        "n8n / OpenAI"
      ],
      "read": [
        "api",
        "Read-only business context",
        "Gmail / ClickUp"
      ],
      "approve": [
        "approval",
        "Review before calendar write",
        "Slack approval"
      ],
      "calendar": [
        "external",
        "Meeting operations",
        "Google Calendar"
      ]
    },
    "labels": {
      "slack:auth": "Assistant mention",
      "auth:agent": "Authorised request",
      "agent:read": "Context query",
      "agent:approve": "Proposed action",
      "approve:calendar": "Approved calendar action",
      "agent:slack": "Thread reply"
    }
  },
  "northstar": {
    "nodes": {
      "dispatch": [
        "input",
        "Fleet oversight",
        "Web application"
      ],
      "driver": [
        "input",
        "Journey controls",
        "Driver workspace"
      ],
      "journey": [
        "database",
        "Shared journey state",
        "Application / API"
      ],
      "event": [
        "automation",
        "Arrival-event handling",
        "n8n"
      ],
      "report": [
        "ai",
        "Journey summary",
        "Reporting / AI"
      ],
      "outputs": [
        "output",
        "Reporting hand-off",
        "Email / register"
      ]
    },
    "labels": {
      "dispatch:journey": "Dispatch context",
      "driver:journey": "Journey updates",
      "journey:event": "Arrival event",
      "event:report": "Journey report",
      "report:outputs": "Summary and report"
    }
  },
  "roofline": {
    "nodes": {
      "form": [
        "input",
        "Roofing enquiry intake",
        "Website server"
      ],
      "n8n": [
        "automation",
        "Qualification and routing",
        "n8n"
      ],
      "db": [
        "database",
        "Enquiry and action records",
        "Supabase"
      ],
      "notify": [
        "communication",
        "Acknowledgement and alerts",
        "Gmail / Twilio"
      ],
      "booking": [
        "automation",
        "Request and slot checks",
        "n8n"
      ],
      "calendar": [
        "external",
        "Verified booking result",
        "Google Calendar"
      ]
    },
    "labels": {
      "form:n8n": "Roofing enquiry",
      "n8n:db": "Qualification update",
      "db:notify": "Enquiry + send state",
      "db:booking": "Booking record",
      "booking:calendar": "Validated booking request"
    }
  }
};
