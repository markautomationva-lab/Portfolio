// @ts-check
/** @typedef {{id:string,title:string,description:string,imageSrc?:string,imageAlt?:string,caption?:string,reviewed?:boolean,verified?:boolean,replaces?:string[]}} TechnicalEvidence */
/** @typedef {{architecture:{description:string,nodes:{id:string,label:string,description:string}[],edges:string[][]},workflow:TechnicalEvidence[],execution:TechnicalEvidence[],run:string[],technicalDecisions:string[][]}} BehindTheBuild */
/** @type {Record<string,BehindTheBuild>} */
export const projectEngineering = {
  "solara": {
    "architecture": {
      "description": "A consented website enquiry enters n8n, is stored in Airtable, and provides context for the Retell callback. Call-result handling updates the record and routes sales follow-up.",
      "nodes": [
        {
          "id": "form",
          "label": "Website enquiry",
          "description": "Captures contact details, property context and call consent. The browser submits through the website server."
        },
        {
          "id": "n8n",
          "label": "n8n orchestration",
          "description": "Receives the enquiry and checks consent before initiating the call path."
        },
        {
          "id": "airtable",
          "label": "Airtable CRM",
          "description": "Stores the lead and receives mapped call outcomes."
        },
        {
          "id": "retell",
          "label": "Retell voice agent",
          "description": "Sophie asks qualification questions and establishes the requested next step. Booking requires a connected tool to confirm success."
        },
        {
          "id": "results",
          "label": "Call-result webhook",
          "description": "Receives analysed call results and updates the lead record."
        },
        {
          "id": "sales",
          "label": "Sales follow-up",
          "description": "The conditional Gmail branch notifies the sales team when follow-up is requested."
        }
      ],
      "edges": [
        [
          "form",
          "n8n"
        ],
        [
          "n8n",
          "airtable"
        ],
        [
          "n8n",
          "retell"
        ],
        [
          "retell",
          "results"
        ],
        [
          "results",
          "airtable"
        ],
        [
          "results",
          "sales"
        ]
      ]
    },
    "workflow": [
      {
        "id": "n8n-proof-n8n-workflow-2",
        "title": "Solara — Lead Capture",
        "description": "The website enquiry webhook creates an Airtable lead and acknowledges receipt. A consent decision gates the Retell callback to Sophie; the final Airtable update records the call attempt. This is the speed-to-lead entry point, rather than proof of a confirmed appointment.",
        "imageSrc": "assets/projects/solara/workflows/n8n-workflow-2-lossless.webp",
        "imageAlt": "Solara — Lead Capture: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true
      },
      {
        "id": "n8n-proof-n8n-workflow-3",
        "title": "Solara — Call Results",
        "description": "A Retell result webhook checks whether call analysis is ready, updates the Airtable lead with the call outcome, and checks whether sales follow-up was requested. The conditional Gmail branch notifies sales. This diagram shows result handling separately from initial lead capture.",
        "imageSrc": "assets/projects/solara/workflows/n8n-workflow-3.png",
        "imageAlt": "Solara — Call Results: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true
      },
      {
        "id": "lead-capture",
        "title": "Enquiry capture and consent",
        "description": "The workflow creates an Airtable lead, acknowledges receipt, checks call consent and initiates Sophie’s call.",
        "imageSrc": "assets/projects/solara/screenshots/lead-capture-lossless.webp",
        "imageAlt": "Enquiry capture and consent — solara",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "call-results",
        "title": "Call-result routing",
        "description": "The results webhook checks analysis readiness, updates Airtable and conditionally notifies sales.",
        "imageSrc": "assets/projects/solara/screenshots/call-results-lossless.webp",
        "imageAlt": "Call-result routing — solara",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "sophie-instructions",
        "title": "Voice-agent rules",
        "description": "The supplied configuration defines identity checks, solar qualification and honest next-step wording. It explicitly requires tool confirmation before claiming a booking.",
        "imageSrc": "assets/projects/solara/screenshots/sophie-instructions-lossless.webp",
        "imageAlt": "Voice-agent rules — solara",
        "caption": "Original project screenshot. ",
        "reviewed": true
      }
    ],
    "execution": [
      {
        "id": "solara-outbound-call",
        "title": "Outbound call after form submission",
        "description": "After the visitor submits the solar enquiry form and provides call consent, n8n saves the lead and initiates an outbound Retell call from Sophie. The call follows up the enquiry and discusses the customer’s solar requirements.",
        "imageSrc": "assets/projects/solara/screenshots/outbound-call-illustration.svg",
        "imageAlt": "Illustration showing a submitted Solara enquiry form triggering an outbound callback from Sophie, with a ringing phone",
        "caption": "Purpose-built process illustration, not a captured phone call or proof of a completed booking.",
        "reviewed": true
      },
      {
        "id": "call-results-tested",
        "title": "Recorded call-result execution",
        "description": "Highlighted nodes show the analysed-result path reaching the Airtable update and Gmail follow-up branch. This frame does not establish a complete form-to-booking test.",
        "imageSrc": "assets/projects/solara/screenshots/call-results-tested-lossless.webp",
        "imageAlt": "Recorded call-result execution — solara",
        "caption": "Original project screenshot. Recorded executed path; not an end-to-end production certification.",
        "reviewed": true
      }
    ],
    "run": [
      "Analysed call results arrive at the webhook.",
      "The readiness condition and follow-up flag determine the path.",
      "The illustrated run updates the lead and reaches the sales notification branch.",
      "Highlighted executed nodes are visible; complete appointment booking is not evidenced by this frame."
    ],
    "technicalDecisions": [
      [
        "Consent before calling",
        "The enquiry workflow checks call consent before initiating the Retell call."
      ],
      [
        "Separate outcome handling",
        "Call analysis arrives separately, so the result webhook updates CRM state after the call."
      ],
      [
        "Truthful confirmation",
        "The supplied voice configuration treats a consultation preference as unconfirmed until a connected booking tool reports success."
      ]
    ]
  },
  "hayes": {
    "architecture": {
      "description": "The website chat connects to an n8n agent. Agency knowledge is retrieved through Supabase vectors while structured property tools handle listings and viewing requests.",
      "nodes": [
        {
          "id": "chat",
          "label": "Website chatbot",
          "description": "Sends the visitor’s message and session identifier to the n8n chat endpoint."
        },
        {
          "id": "agent",
          "label": "n8n AI agent",
          "description": "Routes conversation to the model, memory, retrieval and property tools."
        },
        {
          "id": "model",
          "label": "OpenAI + memory",
          "description": "The workflow connects an OpenAI chat model and simple conversational memory."
        },
        {
          "id": "rag",
          "label": "Supabase retrieval",
          "description": "Agency articles are prepared and embedded; the vector store is connected as an agent tool."
        },
        {
          "id": "property",
          "label": "Property tools",
          "description": "Separate tools search listings, get property details and prepare a viewing draft."
        },
        {
          "id": "confirm",
          "label": "Viewing confirmation",
          "description": "Checks draft eligibility and property status before submission; notification follows a newly saved request."
        }
      ],
      "edges": [
        [
          "chat",
          "agent"
        ],
        [
          "agent",
          "model"
        ],
        [
          "agent",
          "rag"
        ],
        [
          "agent",
          "property"
        ],
        [
          "property",
          "confirm"
        ]
      ]
    },
    "workflow": [
      {
        "id": "n8n-proof-n8n-workflow-4",
        "title": "Property Assistant",
        "description": "A chat message enters a confirmation check. The AI agent connects OpenAI, conversation memory, Supabase document retrieval, property search and property-detail tools. Viewing preparation creates a draft; a separate confirmation path retrieves the session draft and calls the confirmation workflow. A request is distinct from an agent-confirmed viewing appointment.",
        "imageSrc": "assets/projects/hayes/workflows/n8n-workflow-4-lossless.webp",
        "imageAlt": "Property Assistant: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true,
        "replaces": [
          "assets/projects/hayes/screenshots/rag-chat-workflow-lossless.webp"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-5",
        "title": "Hayes & Home — Confirm Viewing Request",
        "description": "The subworkflow looks up the viewing draft, checks eligibility, and rechecks the property status before submitting the confirmed request through Supabase. It checks whether a new request was saved, sends the configured SMS and email notifications, and returns a submission receipt. The receipt confirms request submission, not estate-agent acceptance of the appointment.",
        "imageSrc": "assets/projects/hayes/workflows/viewing-confirmation-presentation-lossless.webp",
        "imageAlt": "Hayes & Home — Confirm Viewing Request: connected n8n workflow diagram",
        "caption": "Presentation image edited with AI to remove a warning triangle. Shows the viewing-request process; use the untouched, dated Execution capture for historical run evidence. The underlying workflow was not changed.",
        "reviewed": true,
        "replaces": [
          "assets/projects/hayes/screenshots/confirm-viewing-lossless.webp"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-17",
        "title": "Submit Viewing Request",
        "description": "The subworkflow validates the request and checks that the selected property accepts viewing requests. It prepares a viewing summary and draft record, saves or reuses the draft through Supabase, and returns the draft for review. Final confirmation and notification happen in the separate confirmation workflow.",
        "imageSrc": "assets/projects/hayes/workflows/viewing-draft-supplied.png",
        "imageAlt": "Submit Viewing Request: connected n8n workflow diagram",
        "caption": "User-supplied viewing-draft workflow diagram. Configuration view, separate from final confirmation.",
        "reviewed": true
      },
      {
        "id": "n8n-proof-n8n-workflow-18",
        "title": "Hayes & Home — Test Knowledge Search",
        "description": "A manual diagnostic trigger connects the Supabase vector-search node to OpenAI embeddings. This small supporting workflow isolates knowledge retrieval for testing; its presence is not proof that every query succeeds or that the current backend is healthy.",
        "imageSrc": "assets/projects/hayes/workflows/n8n-workflow-18.png",
        "imageAlt": "Hayes & Home — Test Knowledge Search: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true
      }
    ],
    "execution": [
      {
        "id": "n8n-rag-success",
        "title": "Successful RAG retrieval execution",
        "description": "14 October 2026, 20:10:47. Succeeded in 16.957s. Green chat-to-agent path includes Supabase vector retrieval and OpenAI embeddings.",
        "imageSrc": "assets/projects/hayes/execution/n8n-rag-success.png",
        "imageAlt": "Successful RAG retrieval execution with the recorded green execution path in n8n",
        "caption": "Captured read-only from saved n8n execution history on 27 October 2026. Green nodes show the executed branch; grey branches were not taken. A successful email or SMS node is not proof of recipient delivery.",
        "reviewed": true,
        "verified": true
      },
      {
        "id": "n8n-viewing-confirmation-16225",
        "title": "Viewing request reaches the final receipt",
        "description": "14 October 2026, 20:17:34. Succeeded in 1.331s. Green path reaches draft and property checks, confirmed request submission, SMS and email notification nodes, and Return Submission Receipt.",
        "imageSrc": "assets/projects/hayes/execution/n8n-viewing-confirmation-16225.png",
        "imageAlt": "Viewing request reaches the final receipt with the recorded green execution path in n8n",
        "caption": "Captured read-only from saved n8n execution history on 27 October 2026. Green nodes show the executed branch; grey branches were not taken. A successful email or SMS node is not proof of recipient delivery.",
        "reviewed": true,
        "verified": true
      },
      {
        "id": "n8n-knowledge-ingestion-16204",
        "title": "Knowledge ingestion through Supabase",
        "description": "14 October 2026, 20:01:59. Succeeded in 12.808s. Green loop shows 35 prepared articles processed through Supabase, OpenAI embeddings and document loading.",
        "imageSrc": "assets/projects/hayes/execution/knowledge-ingestion-supplied-lossless.webp",
        "imageAlt": "Knowledge ingestion through Supabase with the recorded green execution path in n8n",
        "caption": "User-supplied execution image showing 35 articles processed through embeddings, document loading and Supabase. The screenshot itself does not display a date; the separately reviewed saved run was dated 14 October 2026.",
        "reviewed": true,
        "verified": true,
        "replaces": [
          "assets/projects/hayes/workflows/n8n-workflow-6.png",
          "assets/projects/hayes/screenshots/knowledge-ingestion-lossless.webp"
        ]
      },
      {
        "id": "chatbot-screenshot",
        "title": "Chat interface output",
        "description": "The supplied screenshot shows the website conversation interface. It is UI evidence, not an execution trace proving retrieval accuracy or saved bookings.",
        "imageSrc": "assets/projects/hayes/screenshots/chatbot-screenshot.jpg",
        "imageAlt": "Chat interface output — hayes",
        "caption": "Original project screenshot. ",
        "reviewed": true
      }
    ],
    "run": [
      "The historical examples cover a chat message, knowledge ingestion and a viewing-confirmation request on 14 October 2026.",
      "Green paths show vector retrieval, embedding-backed ingestion and draft/property checks in separate saved executions.",
      "The ingestion run processes 35 articles; the viewing-confirmation run reaches its final submission receipt.",
      "Saved success states and executed nodes are visible. They do not establish accuracy for all queries or guarantee present-day backend availability."
    ],
    "technicalDecisions": [
      [
        "Knowledge and listings stay separate",
        "Vector retrieval serves agency information; structured property tools preserve exact listing constraints."
      ],
      [
        "Recheck before submission",
        "The confirmation workflow checks draft state and current property status before saving a viewing request."
      ],
      [
        "Return honest errors",
        "Website chat exposes empty replies, HTTP failures and timeouts instead of inventing a fallback answer."
      ]
    ]
  },
  "grace": {
    "architecture": {
      "description": "Retell handles the inbound conversation, while n8n mediates GoHighLevel contact and appointment operations. Confirmed details precede booking.",
      "nodes": [
        {
          "id": "caller",
          "label": "Inbound caller",
          "description": "The caller explains their home-improvement enquiry and confirms contact details."
        },
        {
          "id": "retell",
          "label": "Retell / Grace",
          "description": "The voice agent looks up the caller, qualifies the enquiry and requests availability."
        },
        {
          "id": "n8n",
          "label": "n8n action routing",
          "description": "Webhook branches handle contact lookup, availability, booking, rescheduling and cancellation."
        },
        {
          "id": "contact",
          "label": "GoHighLevel contacts",
          "description": "A contact is found or created using the caller information."
        },
        {
          "id": "calendar",
          "label": "Survey availability",
          "description": "The workflow checks available survey slots before the caller chooses a time."
        },
        {
          "id": "booking",
          "label": "GoHighLevel booking",
          "description": "The recorded demonstration shows a Free Survey opportunity in the Survey Booked stage."
        }
      ],
      "edges": [
        [
          "caller",
          "retell"
        ],
        [
          "retell",
          "n8n"
        ],
        [
          "n8n",
          "contact"
        ],
        [
          "n8n",
          "calendar"
        ],
        [
          "calendar",
          "retell"
        ],
        [
          "n8n",
          "booking"
        ]
      ]
    },
    "workflow": [
      {
        "id": "main-workflow",
        "title": "Reception and appointment routing",
        "description": "The supplied n8n overview shows contact lookup and branches for availability, booking, rescheduling and cancellation.",
        "imageSrc": "assets/projects/grace/screenshots/main-workflow-lossless.webp",
        "imageAlt": "Reception and appointment routing — grace",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "retell-instructions",
        "title": "Conversation and confirmation rules",
        "description": "The Retell configuration requires caller lookup, returned availability and confirmed customer details before appointment actions.",
        "imageSrc": "assets/projects/grace/screenshots/retell-instructions-lossless.webp",
        "imageAlt": "Conversation and confirmation rules — grace",
        "caption": "Original project screenshot. ",
        "reviewed": true
      }
    ],
    "execution": [
      {
        "id": "ghl-survey-booking",
        "title": "Survey booked in GoHighLevel",
        "description": "The Loom frame shows Mark John’s demonstration Free Survey in Survey Booked, with June 26 at 4 pm.",
        "imageSrc": "assets/projects/grace/screenshots/ghl-survey-booking-lossless.webp",
        "imageAlt": "Survey booked in GoHighLevel — grace",
        "caption": "Original project screenshot. Extracted from the supplied Loom recording at 03:38. Fictional portfolio scenario.",
        "reviewed": true
      }
    ],
    "run": [
      "A demonstration caller chooses a survey slot and confirms their details.",
      "Retell invokes the appointment tool through n8n.",
      "The recorded GoHighLevel pipeline contains the matching Free Survey entry.",
      "The booking stage and June 26, 4 pm timestamp are visible in the supplied recording; no business conversion metric is inferred."
    ],
    "technicalDecisions": [
      [
        "Look up before creating",
        "Contact lookup precedes contact creation to preserve caller context."
      ],
      [
        "Availability comes from the tool",
        "The voice instructions prohibit offering a time before availability returns."
      ],
      [
        "Confirm before claiming success",
        "The agent waits for the action response before saying the appointment is booked."
      ]
    ]
  },
  "hvc": {
    "architecture": {
      "description": "A Slack mention enters an authorised n8n agent with email, calendar and task tools. Calendar mutations pass through a Slack approval checkpoint.",
      "nodes": [
        {
          "id": "slack",
          "label": "Slack mention",
          "description": "The user addresses the assistant in Slack; responses return in the same thread."
        },
        {
          "id": "auth",
          "label": "Authorised-user gate",
          "description": "The workflow checks the authorised user before invoking the assistant."
        },
        {
          "id": "agent",
          "label": "n8n + OpenAI",
          "description": "The conversational agent uses the model, memory and connected tools."
        },
        {
          "id": "read",
          "label": "Gmail + ClickUp",
          "description": "Read tools provide email and task context; Google Calendar exposes meeting lookups."
        },
        {
          "id": "approve",
          "label": "Human approval",
          "description": "Booking, rescheduling and cancellation use Slack send-and-wait approval controls."
        },
        {
          "id": "calendar",
          "label": "Google Calendar",
          "description": "Calendar write tools sit downstream of their corresponding approval nodes."
        }
      ],
      "edges": [
        [
          "slack",
          "auth"
        ],
        [
          "auth",
          "agent"
        ],
        [
          "agent",
          "read"
        ],
        [
          "agent",
          "approve"
        ],
        [
          "approve",
          "calendar"
        ],
        [
          "agent",
          "slack"
        ]
      ]
    },
    "workflow": [
      {
        "id": "n8n-proof-n8n-workflow-7",
        "title": "HVC — Conversation Assistant",
        "description": "A Slack mention first passes an authorised-user check. The OpenAI-backed conversation agent can retrieve email, meetings and task context and reply in the Slack thread. Meeting booking, rescheduling and cancellation tools are connected through human-review approval steps, keeping calendar changes under user control.",
        "imageSrc": "assets/projects/hvc/workflows/n8n-workflow-7-lossless.webp",
        "imageAlt": "HVC — Conversation Assistant: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true
      },
      {
        "id": "n8n-proof-n8n-workflow-8",
        "title": "HVC — Morning Brief",
        "description": "Scheduled or manual entry starts the brief workflow. It collects email, calendar events and commitments, combines the three sources, prepares the brief input, generates the executive brief, formats the verified output and posts it to Slack. The diagram demonstrates the connected briefing structure; it does not establish a successful delivery on the capture date.",
        "imageSrc": "assets/projects/hvc/workflows/n8n-workflow-8-lossless.webp",
        "imageAlt": "HVC — Morning Brief: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true
      },
      {
        "id": "hvc-assistant-complete-workflow",
        "title": "Assistant tools and approvals",
        "description": "The complete workflow separates read tools from approval-gated calendar changes.",
        "imageSrc": "assets/projects/hvc/screenshots/hvc-assistant-complete-workflow-lossless.webp",
        "imageAlt": "Assistant tools and approvals — hvc",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "hvc-morning-brief-scheduled-workflow",
        "title": "Scheduled morning brief",
        "description": "The scheduled workflow collects daily context and prepares a Slack briefing.",
        "imageSrc": "assets/projects/hvc/screenshots/hvc-morning-brief-scheduled-workflow-lossless.webp",
        "imageAlt": "Scheduled morning brief — hvc",
        "caption": "Original project screenshot. ",
        "reviewed": true
      }
    ],
    "execution": [
      {
        "id": "hvc-assistant-execution-view",
        "title": "Recorded assistant execution",
        "description": "The composite execution capture shows a successful run with highlighted Slack, agent and tool paths. Only the highlighted branches establish execution in this capture.",
        "imageSrc": "assets/projects/hvc/screenshots/hvc-assistant-execution-view-lossless.webp",
        "imageAlt": "Recorded assistant execution — hvc",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "hvc-french-email-draft",
        "title": "Draft output for review",
        "description": "The Slack thread shows a French email draft explicitly labelled “Draft — not sent”.",
        "imageSrc": "assets/projects/hvc/screenshots/hvc-french-email-draft.png",
        "imageAlt": "Draft output for review — hvc",
        "caption": "Original project screenshot. ",
        "reviewed": true
      }
    ],
    "run": [
      "An authorised user mentions the assistant in Slack.",
      "The agent retrieves connected context and selects the applicable tool path.",
      "A threaded reply or reviewable draft is produced; calendar changes use an approval step.",
      "The supplied execution screenshot and draft show recorded behaviour, not a guarantee that every tool path ran in that execution."
    ],
    "technicalDecisions": [
      [
        "Read and write paths differ",
        "Read tools retrieve context, while calendar changes are routed through explicit human approval."
      ],
      [
        "Draft before sending",
        "The demonstrated multilingual reply remains a reviewable draft rather than an automatically sent email."
      ],
      [
        "Keep the conversation together",
        "Slack thread replies retain context without requiring a separate application interface."
      ]
    ]
  },
  "northstar": {
    "architecture": {
      "description": "The dispatch and driver workspaces share journey state. The supplied arrival-reporting workflow illustrates the downstream reporting, email and accounting hand-off; simulated positions and estimated costs remain explicit.",
      "nodes": [
        {
          "id": "dispatch",
          "label": "Dispatch workspace",
          "description": "The supplied app capture exposes the fleet map and selected vehicle context."
        },
        {
          "id": "driver",
          "label": "Driver workspace",
          "description": "The driver view provides journey and delivery actions for the assigned vehicle."
        },
        {
          "id": "journey",
          "label": "Journey state / API",
          "description": "The application stores journey progress and exposes documented API endpoints."
        },
        {
          "id": "event",
          "label": "Arrival workflow",
          "description": "The supplied n8n screenshot reads arrival events and routes report preparation."
        },
        {
          "id": "report",
          "label": "Report + summary",
          "description": "The workflow shows journey-report retrieval and an AI accounting-summary branch."
        },
        {
          "id": "outputs",
          "label": "Email + register",
          "description": "The supplied workflow includes owner notification, accounting email and register update steps; full delivery is not independently verified here."
        }
      ],
      "edges": [
        [
          "dispatch",
          "journey"
        ],
        [
          "driver",
          "journey"
        ],
        [
          "journey",
          "event"
        ],
        [
          "event",
          "report"
        ],
        [
          "report",
          "outputs"
        ]
      ]
    },
    "workflow": [
      {
        "id": "n8n-proof-n8n-journey-events",
        "title": "Northstar Journey Events",
        "description": "A scheduled trigger reads the journey cursor and requests new events. The workflow checks for events, splits them, saves journey updates and advances the cursor after processing. This connects the simulated fleet application to incremental event handling.",
        "imageSrc": "assets/projects/northstar/workflows/n8n-journey-events-lossless.webp",
        "imageAlt": "Northstar Journey Events: connected n8n workflow diagram",
        "caption": "User-supplied execution screenshot. Green nodes show journey events reaching Save Journey Cursor; the screenshot itself does not identify its execution date.",
        "reviewed": true
      },
      {
        "id": "n8n-proof-n8n-workflow-1",
        "title": "Northstar Arrival Reporting",
        "description": "The workflow retrieves arrival events and processes them one at a time. It loads the completed journey report, checks saved processing receipts, sends the owner notification, stores the report and OpenAI accounting summary, and sends accounting its summary. The cursor is saved after the event loop. Saved summaries and receipts help avoid repeating completed steps; the accounting-sheet node is shown separately and is not evidence of a completed sheet update.",
        "imageSrc": "assets/projects/northstar/workflows/n8n-workflow-1-lossless.webp",
        "imageAlt": "Northstar Arrival Reporting: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true,
        "replaces": [
          "assets/projects/northstar/screenshots/n8n-Arrival-Reporting-lossless.webp"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-16",
        "title": "NorthStar Logistics Connection Test",
        "description": "Scheduled and manual entry points retrieve fleet state, split incidents and check whether an advisory is needed. The workflow limits processing to one incident, attaches truck context, prepares an advisory and saves it back to the application. This is a supporting connectivity and advisory workflow, separate from journey events and arrival reporting.",
        "imageSrc": "assets/projects/northstar/workflows/n8n-workflow-16.png",
        "imageAlt": "NorthStar Logistics Connection Test: connected n8n workflow diagram",
        "caption": "User-supplied workflow configuration screenshot showing the incident advisory path. This diagram is not a successful execution trace.",
        "reviewed": true
      }
    ],
    "execution": [
      {
        "id": "n8n-arrival-16395",
        "title": "Successful arrival-to-accounting execution",
        "description": "Succeeded in 19.935s. Green path covers arrival retrieval, owner email, saved report, AI summary, accounting email receipt and final cursor save.",
        "imageSrc": "assets/projects/northstar/execution/n8n-arrival-16395.png",
        "imageAlt": "Successful arrival-to-accounting execution with the recorded green execution path in n8n",
        "caption": "Captured read-only from saved n8n execution history on 27 October 2026. Green nodes show the executed branch; grey branches were not taken. A successful email or SMS node is not proof of recipient delivery.",
        "reviewed": true,
        "verified": true
      },
      {
        "id": "n8n-journey-events-16322",
        "title": "Journey events saved through the final cursor",
        "description": "18 October 2026, 23:47:00. Succeeded in 212ms. Green path processes two journey events and reaches Save Journey Cursor.",
        "imageSrc": "assets/projects/northstar/execution/n8n-journey-events-16322.png",
        "imageAlt": "Journey events saved through the final cursor with the recorded green execution path in n8n",
        "caption": "Captured read-only from saved n8n execution history on 27 October 2026. Green nodes show the executed branch; grey branches were not taken. A successful email or SMS node is not proof of recipient delivery.",
        "reviewed": true,
        "verified": true
      },
      {
        "id": "Dispatch-Web-App",
        "title": "Dispatch application output",
        "description": "The app capture demonstrates the fleet map, vehicle overview and operational interface. Positions belong to the fictional simulation.",
        "imageSrc": "assets/projects/northstar/screenshots/Dispatch-Web-App-lossless.webp",
        "imageAlt": "Dispatch application output — northstar",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "Reports-and-Costs",
        "title": "Reports and estimated costs",
        "description": "The supplied application view shows report and cost-review sections. Estimated values are not audited actual operating costs.",
        "imageSrc": "assets/projects/northstar/screenshots/Reports-and-Costs-lossless.webp",
        "imageAlt": "Reports and estimated costs — northstar",
        "caption": "Original project screenshot. ",
        "reviewed": true
      }
    ],
    "run": [
      "A recorded scheduled arrival-processing run starts on 22 October 2026.",
      "The green path retrieves arrival events, loads the journey report and checks existing processing receipts.",
      "The selected run reaches report saving, AI summary saving, accounting notification receipt and final cursor save.",
      "n8n marks execution 16395 successful in 19.935 seconds. This verifies that recorded workflow path, not live GPS accuracy or external email delivery."
    ],
    "technicalDecisions": [
      [
        "Simulation stays explicit",
        "Cached UK road routes and simulated movement make dispatch scenarios repeatable without live driver tracking."
      ],
      [
        "API boundary for automation",
        "Documented authenticated endpoints keep external orchestration separate from the application state."
      ],
      [
        "Costs carry assumptions",
        "Report values are estimates and must not be presented as audited accounting figures."
      ]
    ]
  },
  "roofline": {
    "architecture": {
      "description": "The website server forwards roofing enquiries to n8n. Qualification updates Supabase, then routes acknowledgements and SMS. A separate booking workflow validates availability before confirming the record.",
      "nodes": [
        {
          "id": "form",
          "label": "Roofing enquiry form",
          "description": "Collects service, property, urgency and contact preferences with validation."
        },
        {
          "id": "n8n",
          "label": "n8n qualification",
          "description": "The lead-processing screenshot checks postcode, scope and urgency before routing."
        },
        {
          "id": "db",
          "label": "Supabase records",
          "description": "The workflows store enquiry state, qualification and sending outcomes."
        },
        {
          "id": "notify",
          "label": "Email + SMS",
          "description": "Gmail handles acknowledgement and owner alerts; the SMS flow checks eligibility and reserves a send before Twilio."
        },
        {
          "id": "booking",
          "label": "Booking checks",
          "description": "The separate booking workflow validates the request and rechecks calendar availability."
        },
        {
          "id": "calendar",
          "label": "Calendar confirmation",
          "description": "The workflow verifies a created calendar event before confirming the booking record and email path."
        }
      ],
      "edges": [
        [
          "form",
          "n8n"
        ],
        [
          "n8n",
          "db"
        ],
        [
          "db",
          "notify"
        ],
        [
          "db",
          "booking"
        ],
        [
          "booking",
          "calendar"
        ]
      ]
    },
    "workflow": [
      {
        "id": "n8n-proof-n8n-workflow-9",
        "title": "Roofline Speed to Lead",
        "description": "A website form submission is prepared and saved in Supabase with duplicate protection. Postcode and coverage checks lead into leak urgency, supported-service, authority and timeframe decisions. The assessment is saved, customer and owner Gmail notifications have separate send records, and the SMS follow-up is connected. The workflow notes identify test-inbox delivery and distinguish urgent review from emergency dispatch.",
        "imageSrc": "assets/projects/roofline/workflows/speed-to-lead-supplied-lossless.webp",
        "imageAlt": "Roofline Speed to Lead: connected n8n workflow diagram",
        "caption": "User-supplied Roofline workflow screenshot. Shows the configured nodes, decision branches and integrations; this view is not a completed execution trace.",
        "reviewed": true,
        "replaces": [
          "assets/projects/roofline/workflows/n8n-workflow-9.png",
          "assets/projects/roofline/screenshots/lead-processing-lossless.webp"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-10",
        "title": "Roofline SMS Follow-up",
        "description": "The workflow receives an enquiry ID, loads the saved enquiry and checks SMS eligibility. It reserves the sending attempt to reduce duplicates, prepares the message, submits it through Twilio and records success or error in Supabase. A successful send response is distinct from handset delivery, which is handled by the tracking workflow.",
        "imageSrc": "assets/projects/roofline/workflows/sms-follow-up-supplied.png",
        "imageAlt": "Roofline SMS Follow-up: connected n8n workflow diagram",
        "caption": "User-supplied Roofline workflow screenshot. Shows the configured nodes, decision branches and integrations; this view is not a completed execution trace.",
        "reviewed": true,
        "replaces": [
          "assets/projects/roofline/workflows/n8n-workflow-10.png",
          "assets/projects/roofline/screenshots/sms-follow-up-lossless.webp"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-11",
        "title": "Roofline Voice — Book Appointment.",
        "description": "The booking webhook prepares and validates the caller-confirmed request, reserves it in Supabase and performs a final Google Calendar availability check. It creates and verifies the event before confirming the database booking and returning the result. A separately claimed Gmail confirmation is sent and its outcome recorded to reduce duplicate confirmations.",
        "imageSrc": "assets/projects/roofline/workflows/booking-supplied.png",
        "imageAlt": "Roofline Voice — Book Appointment.: connected n8n workflow diagram",
        "caption": "User-supplied Roofline workflow screenshot. Shows the configured nodes, decision branches and integrations; this view is not a completed execution trace.",
        "reviewed": true,
        "replaces": [
          "assets/projects/roofline/workflows/n8n-workflow-11.png",
          "assets/projects/roofline/screenshots/booking-lossless.webp"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-12",
        "title": "Roofline Voice — Check Availability",
        "description": "A voice availability request is prepared and validated before Google Calendar busy times are retrieved. The workflow builds available slots and returns them through the webhook response. Availability lookup is separate from creating a booking; the booking workflow performs its own final calendar check.",
        "imageSrc": "assets/projects/roofline/workflows/availability-supplied.png",
        "imageAlt": "Roofline Voice — Check Availability: connected n8n workflow diagram",
        "caption": "User-supplied Roofline workflow screenshot. Shows the configured nodes, decision branches and integrations; this view is not a completed execution trace.",
        "reviewed": true,
        "replaces": [
          "assets/projects/roofline/workflows/n8n-workflow-12.png"
        ]
      },
      {
        "id": "n8n-proof-n8n-workflow-13",
        "title": "Roofline SMS Tracking",
        "description": "A delivery-status webhook retrieves Twilio status, finds the related SMS record and routes delivered or failed outcomes into Supabase updates. A wait-and-retry path handles records that are not ready yet; unresolved records stop for review. This provides delivery tracking separately from the initial SMS submission.",
        "imageSrc": "assets/projects/roofline/workflows/sms-tracking-supplied.png",
        "imageAlt": "Roofline SMS Tracking: connected n8n workflow diagram",
        "caption": "User-supplied Roofline workflow screenshot. Shows the configured nodes, decision branches and integrations; this view is not a completed execution trace.",
        "reviewed": true,
        "replaces": [
          "assets/projects/roofline/workflows/n8n-workflow-13.png"
        ]
      },
      {
        "id": "n8n-proof-n8n-calendar-test",
        "title": "Roofline Calendar Connection Test.",
        "description": "A manual diagnostic trigger connects calendar event retrieval and availability lookup. It is a supporting check of the Google Calendar integration, separate from voice availability and appointment creation. No test was executed during this screenshot review.",
        "imageSrc": "assets/projects/roofline/workflows/n8n-calendar-test.png",
        "imageAlt": "Roofline Calendar Connection Test.: connected n8n workflow diagram",
        "caption": "Workflow configuration captured read-only on 27 October 2026. Shows the connected design; this editor view is not a successful execution trace. No workflow was run or changed during capture.",
        "reviewed": true
      }
    ],
    "execution": [
      {
        "id": "lead-processing",
        "title": "Highlighted lead-processing run",
        "description": "Green executed paths are visible in the supplied lead-processing screenshot. It is not proof of every downstream SMS or booking outcome.",
        "imageSrc": "assets/projects/roofline/screenshots/lead-processing-lossless.webp",
        "imageAlt": "Highlighted lead-processing run — roofline",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "operations-dashboard",
        "title": "Dashboard output — sample snapshot",
        "description": "The dashboard explicitly labels its sample data. It supports reviewing enquiry and appointment snapshots, not live execution monitoring.",
        "imageSrc": "assets/projects/roofline/screenshots/operations-dashboard.png",
        "imageAlt": "Dashboard output — sample snapshot — roofline",
        "caption": "Original project screenshot. ",
        "reviewed": true
      },
      {
        "id": "sms-message-example",
        "title": "SMS follow-up — message example",
        "description": "Illustrative customer acknowledgement for an eligible roofing enquiry. The configured workflow checks eligibility, reserves the sending attempt, submits the SMS through Twilio and records its outcome. This example does not confirm handset delivery.",
        "imageSrc": "assets/projects/roofline/screenshots/sms-follow-up-example.svg",
        "imageAlt": "SMS follow-up — message example for Roofline",
        "caption": "Purpose-built example message, not an inbox screenshot or proof of delivery. Message wording is illustrative.",
        "reviewed": true
      },
      {
        "id": "email-message-example",
        "title": "Email acknowledgement — message example",
        "description": "Illustrative customer email acknowledging receipt of a roofing enquiry and explaining the next step. The workflow sends and records customer and owner notifications; an acknowledgement does not confirm a survey, quotation or appointment.",
        "imageSrc": "assets/projects/roofline/screenshots/email-acknowledgement-example.svg",
        "imageAlt": "Email acknowledgement — message example for Roofline",
        "caption": "Purpose-built example message, not an inbox screenshot or proof of delivery. Message wording is illustrative.",
        "reviewed": true
      }
    ],
    "run": [
      "A roofing enquiry enters the lead-processing webhook.",
      "The shown path stores and qualifies the enquiry, then routes notifications.",
      "The capture shows highlighted branches; the dashboard separately presents sample operational records.",
      "Executed branches are visible, while sample dashboard counts are not claimed as live customer or business results."
    ],
    "technicalDecisions": [
      [
        "Reserve before sending",
        "The SMS workflow reserves an acknowledgement before sending to reduce duplicate messages."
      ],
      [
        "Verify the booking",
        "Calendar availability is checked again and the created event is verified before confirmation."
      ],
      [
        "Separate review from operations",
        "The dashboard reads sample or imported snapshots and does not mutate live automation state."
      ]
    ]
  }
};
