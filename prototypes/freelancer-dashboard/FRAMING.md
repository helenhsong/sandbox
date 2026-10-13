# Freelancer dashboard: framing

**Working prompt:** Design a business management dashboard for a freelancer.

## 1. Purpose

We are exploring **a business management dashboard for a freelancer**.

By the end of this session, we want **a quick, working prototype that solves a real problem a freelancer client or user might have**, treated like a fast client engagement.

It might matter because **freelancers get taken advantage of, and clients sometimes don't get what they asked for**. A platform that coordinates the work around explicit agreements could keep things fair without the freelancer having to be the one who says no.

Emerging focus: communication and coordination across a project, from request to delivery, including deposits, revision rounds, calls, and invoice updates.

Possible contexts:

- **Jobs to manage:** incoming requests; follow-up asks beyond the original request (scope additions); scheduling and planning their week; getting invoices paid; delivering work and files to clients.
- **Types of freelancer:** any service provider. Digital work: product design, coding, consulting, photography (sends files). Physical, appointment-based work: hair, nails, tattoos.

Session plan: gather context, outline, build, iterate a little, then polish.

## 2. Person

We are designing for **a digital, project-based freelancer (designer, developer, or photographer)** because **they need agreements, revisions, and payments to stay fair without having to police clients themselves**.

- Assumed: chosen from the digital-versus-in-person discussion; in-person, appointment-based freelancers wait.
- Priorities: explicit agreements, fair pay for extra work (deposit, extra revisions, final payment), not having to say no personally.

## 3. Present

- Situation (assumed): mid-project, a client asks for more revisions or extra work beyond the agreement.

- Current journey: **client asks for more, often off-platform → freelancer points to what was agreed → nothing enforces it → rules bend, and the freelancer absorbs the extra work or has an awkward push-back conversation.**
- Breakdown: going off-platform; the agreement exists but has no teeth.
- Open: what context changes the experience.

## 4. Problem

- Need: a clear, shared record of the original agreement and every change to it, so both sides see what is owed.
- Pain point (prioritized): managing the agreement process. Keeping track of how many changes pile onto the original agreement leads to unpaid extra work.
- Saying no becomes easy once there is a clear reason to point to.
- We assume: the client uses the platform too; entering the agreement requires it. The freelancer is the primary user and the client is a required secondary user.
- We assume: these are the freelancer's own clients. A marketplace for finding freelancers could exist later but is not the focus.
- We must work within: none stated.

Problem statement: When **a client asks for changes beyond the original agreement**, **a digital freelancer and their client** want **the original agreement and its pricing for changes recorded up front**, so **the client knows what each request costs and avoids surprise bills, and the freelancer gets paid for extra work**.

Pressure test (first "thoughts?") raised: whether the client is on the platform (yes), which pain is bigger (the agreement process and unpaid extra work), and own clients versus a marketplace (own clients).

Pressure test (second "thoughts?"):

- Better aligned: one moment, one prioritized pain, and the client's role is explicit.
- Timing: a running record after the fact still leaves the freelancer chasing money. Is a change agreed and priced before work starts, or tallied as it happens?
- Client value: the outcome is only the freelancer's. The client has to join, so what do they get (no surprise bills)?
- Scope: the prompt says a business dashboard, but the framing is one project's agreement. Across all clients, or one project?

Second pressure test answered:

- Before or after: the original agreement plus pricing for later changes, set up front.
- Client value: no surprise bills, and clarity on what they can ask for and what each request costs.
- Dashboard shape: unresolved. Carried into Possibilities (writing the initial agreement, tracking agreements, or managing requests).

## 5. Possibilities

Compared on an impact/effort matrix. Impact: value for the freelancer and client, and progress toward no unpaid extra work. Effort: complexity, dependencies, and cost to deliver.

Options (impact / effort, placed by Claude for discussion):

1. Writing the initial agreement, with pricing for changes. Medium impact (sets up the rules but doesn't help at the moment of a change) / medium effort.
2. Tracking agreements across clients. Medium impact (visibility, after the fact) / lower effort.
3. **Managing change requests.** High impact (sits on the exact moment in the problem statement, for both sides) / medium effort (two sides, accept/decline, cost update).

**Chosen:** We chose **managing a change request: the client asks for a change, sees what it would entail, the freelancer accepts or declines with clear requirements, and the dashboard updates with the new cost** because **it tackles the moment where problems happen on both sides**. The client needs to request and know what the request entails; the freelancer needs to communicate clearly whether they accept and on what terms.

- Focus: the flow from the **freelancer's** perspective. The client side appears only as the incoming request and the response they receive.
- Trade-off: the client's own request-and-review experience is not designed deeply.
- Why not writing the agreement: too narrow; many freelancers already write agreements. The real problem is enforcement, clear boundaries, and communication.
- Why not tracking agreements: not stated.
- Main theme: enforcement.

Pressure test ("thoughts?" in Possibilities):

- Managing change requests: strongest case is that it sits on the exact moment of the problem. Concern: accepting or declining in a clean UI is communication, not enforcement. Something has to make the terms stick.
- Writing the agreement: rightly ruled out as the focus, but it is a dependency. A change is only "extra" relative to the agreement, so the prototype needs one seeded.
- Tracking agreements: strongest case is that it matches the "dashboard" prompt. Concern: it is after the fact. Works as the surrounding context where the new cost lands.
- Risk: this direction fails if clients keep asking off-platform (text, email), because those asks never reach the flow.
- Follow-ups: what makes the terms stick? How does the platform know a request is outside the agreement?

Answers:

- The agreement is already in place for this flow; editing it is out of scope.
- What makes terms stick: clients have no access to the freelancer's phone or email; files are sent only through the platform; work waits until the client approves the cost.
- Deposit: required to start the initial work. If the deadline is missed, the client gets the deposit back. Whether each change request needs a deposit is open.
- Outside the agreement: the agreement lives in the platform and spells out the project ask, its tier, the price, and a set price per additional edit request. A request outside it is priced from those terms.

## Open questions

- What context changes the experience (Present).
- Does each change request need its own deposit?
- Hard constraints (none stated).
