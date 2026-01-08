Guide for setting up the webhook forwarding (@Mahdi without this webhooks won't get send to the backend):

Install the Stripe CLI:
Refer to the official Stripe CLI installation guide for detailed instructions for your operating system.

Open your terminal and run:
stripe login

Follow the browser prompts to authenticate your CLI with your Stripe account.
Username: kim.schlemmer2001[at]gmail.com
Password: SEBASS2025

Forward webhooks to the local backend: Ensure backend is running on port 8080. In a new terminal window execute:
stripe listen --forward-to localhost:8080/api/payment/webhook

Test the payment by creating an account or signing into an existing one and then choosing a payment plan on http://localhost:3000/premium. After successful payment check the MongoDB.

E-mail: Enter anything
Card number: 4242 4242 4242 4242 (Stripe test card)
MM/JJ: 12/34
CVC: 123
Name: Enter anything