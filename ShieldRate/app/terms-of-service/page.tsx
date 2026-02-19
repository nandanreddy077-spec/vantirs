'use client'

import { FileText, Scale, AlertTriangle, ArrowLeft, Calendar } from 'lucide-react'
import VantirsLogo from '@/components/VantirsLogo'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <VantirsLogo width={160} height={52} className="flex-shrink-0" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <Scale className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <p>Last updated: February 4, 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service ("Terms," "Agreement") constitute a legally binding agreement between you ("User," "you," or "your") and Vantirs ("Company," "we," "us," or "our") governing your access to and use of our CE 3.0 compliance engine service, website, API, and related services (collectively, the "Service"). By accessing, using, or registering for the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy, which is incorporated herein by reference.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If you do not agree to these Terms, you must not access or use the Service. If you are accessing or using the Service on behalf of a company or other legal entity, you represent and warrant that you have the authority to bind such entity to these Terms, in which case "you" or "your" shall refer to such entity.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right to modify these Terms at any time. Material changes will be notified by posting the updated Terms on this page with a new "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Service and may terminate your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vantirs is a software-as-a-service platform that provides CE 3.0 compliance and chargeback defense tools. Our Service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Automated matching of historical transactions for CE 3.0 eligibility determination</li>
              <li>Generation of compliance reports and evidence documents</li>
              <li>Automated or manual submission of evidence to Stripe on your behalf</li>
              <li>Monitoring and tracking of VAMP ratios and compliance thresholds</li>
              <li>Dashboard and API access for dispute management</li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">⚠️ IMPORTANT DISCLAIMER:</p>
                  <p className="text-red-800 text-sm">
                    Vantirs is a tool that assists with dispute defense. We do not guarantee that any dispute will be won, that CE 3.0 eligibility will be granted, or that your VAMP ratio will remain below any threshold. Dispute outcomes are determined solely by Stripe, Visa, Mastercard, and other card networks, not by Vantirs. We provide tools and information only; we do not provide legal, financial, or professional advice.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration and Eligibility</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                To use our Service, you must:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Be at least 18 years old (or the age of majority in your jurisdiction) and have the legal capacity to enter into binding contracts</li>
                <li>Create an account with accurate, current, and complete information</li>
                <li>Provide a valid Stripe restricted API key with the required permissions (disputes:read, disputes:write, files:write)</li>
                <li>Maintain the security and confidentiality of your account credentials and API keys</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Be responsible for all activities that occur under your account</li>
                <li>Comply with all applicable laws, regulations, and third-party agreements (including Stripe's Terms of Service)</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">Critical Security Requirement:</p>
                    <p className="text-yellow-800 text-sm">
                      You must use a Stripe restricted API key only. We do not accept full secret keys. You are solely responsible for ensuring your API key has the correct permissions and for maintaining its security. You are responsible for any actions taken using your API key, whether authorized by you or not.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to refuse service, suspend or terminate accounts, and remove or edit content at our sole discretion, with or without notice, for any reason, including violation of these Terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use and Prohibited Activities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Use the Service for any illegal, fraudulent, or unauthorized purpose, or in violation of any applicable laws, regulations, or third-party rights</li>
              <li>Use the Service to process disputes for fraudulent, illegal, or unauthorized transactions</li>
              <li>Attempt to gain unauthorized access to our Service, systems, networks, or data, or to interfere with or disrupt the Service or servers</li>
              <li>Transmit any viruses, malware, worms, Trojan horses, or other harmful or malicious code</li>
              <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Service</li>
              <li>Copy, modify, distribute, sell, lease, sublicense, or create derivative works of the Service without our express written permission</li>
              <li>Use automated systems (bots, scrapers, crawlers) to access the Service without our prior written consent</li>
              <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity</li>
              <li>Harass, abuse, threaten, or harm other users or third parties</li>
              <li>Violate any applicable Stripe Terms of Service or other third-party agreements</li>
              <li>Use the Service in any manner that could damage, disable, overburden, or impair our servers or networks</li>
              <li>Collect or harvest information about other users without their consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Violation of this section may result in immediate termination of your account and may subject you to civil and criminal liability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms and Billing</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Our Service operates on a subscription-based model with optional success fees:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Subscription Fees:</strong> Billed monthly in advance based on your selected plan. Fees are non-refundable except as required by law or at our sole discretion</li>
                <li><strong>Success Fees:</strong> If applicable to your plan, charged as a percentage of the dispute amount when a dispute is won. Success fees are final and non-refundable</li>
                <li><strong>Price Changes:</strong> We reserve the right to modify pricing with 30 days' advance notice. Continued use after the effective date constitutes acceptance of new pricing</li>
                <li><strong>Payment Methods:</strong> Payment is processed securely through Stripe. You agree to provide accurate payment information and authorize us to charge your payment method</li>
                <li><strong>Failed Payments:</strong> If payment fails, we may suspend or terminate your account. You remain responsible for all fees incurred</li>
                <li><strong>Refunds:</strong> All fees are non-refundable except as required by applicable law. We may, at our sole discretion, provide refunds in exceptional circumstances</li>
                <li><strong>Taxes:</strong> You are responsible for all taxes, duties, and government charges associated with your use of the Service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Payment processing is handled by Stripe. By using our Service, you agree to Stripe's Terms of Service and Privacy Policy. We are not responsible for Stripe's services or any issues arising from payment processing.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Availability and Modifications</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We strive to maintain high availability of our Service, but we do not guarantee uninterrupted, error-free, or secure access. The Service may be unavailable, delayed, or interrupted due to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Scheduled or unscheduled maintenance</li>
              <li>Technical failures, bugs, or errors</li>
              <li>Third-party service outages (e.g., Stripe, Supabase, hosting providers)</li>
              <li>Force majeure events (natural disasters, war, terrorism, pandemics, government actions)</li>
              <li>Cyberattacks, security breaches, or unauthorized access</li>
              <li>Network or internet connectivity issues</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right to modify, suspend, discontinue, or terminate the Service or any part thereof at any time, with or without notice, for any reason. We are not liable for any damages resulting from Service unavailability, modifications, or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service, including all content, features, functionality, software, code, designs, graphics, logos, trademarks, and other materials, is owned by Vantirs or our licensors and is protected by copyright, trademark, patent, trade secret, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Service solely for your internal business purposes in accordance with these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              You may not copy, modify, distribute, sell, lease, sublicense, create derivative works, reverse engineer, decompile, or disassemble any part of the Service without our express written permission. Any unauthorized use may result in immediate termination of your license and may subject you to civil and criminal liability.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              You retain ownership of your data and content. By using the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, store, process, and transmit your data as necessary to provide the Service and as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Warranties</h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 font-semibold mb-2">⚠️ NO WARRANTIES OR GUARANTEES:</p>
                <p className="text-red-800 text-sm leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, RELIABILITY, OR AVAILABILITY. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </div>
              
              <div>
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">No Guarantee of Dispute Outcomes:</p>
                <p className="text-gray-700 leading-relaxed">
                  We provide tools and services to assist with dispute defense, but we do not guarantee, warrant, or represent that:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1 ml-4">
                  <li>Any dispute will be won or resolved in your favor</li>
                  <li>CE 3.0 eligibility will be granted by Visa or Mastercard</li>
                  <li>Your VAMP ratio will remain below any threshold</li>
                  <li>Evidence submitted will be accepted by Stripe or card networks</li>
                  <li>Historical transaction matching will be accurate or complete</li>
                  <li>Compliance reports will be accepted by banks or processors</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Dispute outcomes are determined solely by Stripe, Visa, Mastercard, and other card networks based on their policies, procedures, and discretion. We have no control over or influence on these decisions.
                </p>
              </div>

              <div>
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">No Legal, Financial, or Professional Advice:</p>
                <p className="text-gray-700 leading-relaxed">
                  The Service provides tools and information only. We do not provide legal, financial, accounting, tax, or professional advice. You should consult with qualified professionals for advice regarding your specific situation. Any reliance on information provided by the Service is at your own risk.
                </p>
              </div>

              <div>
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">Third-Party Services:</p>
                <p className="text-gray-700 leading-relaxed">
                  The Service integrates with third-party services (e.g., Stripe, Supabase). We are not responsible for the availability, accuracy, or functionality of third-party services. Your use of third-party services is subject to their respective terms and conditions.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-900 font-semibold mb-2">⚠️ IMPORTANT LIMITATION:</p>
              <p className="text-red-800 text-sm leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VANTIRS, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, LICENSORS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUE, DATA, BUSINESS OPPORTUNITIES, GOODWILL, OR REPUTATION, ARISING OUT OF OR RELATING TO YOUR USE OF OR INABILITY TO USE THE SERVICE, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our total cumulative liability for any claims arising out of or relating to the Service, regardless of the form of action, shall not exceed the greater of: (a) the amount you paid us in the 12 months preceding the claim, or (b) $100 USD.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you. In such cases, our liability will be limited to the maximum extent permitted by law.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We are not liable for any losses or damages resulting from: (1) your use or inability to use the Service, (2) unauthorized access to or alteration of your data, (3) disputes that are not won, (4) CE 3.0 eligibility not being granted, (5) VAMP ratio exceeding thresholds, (6) third-party service failures, (7) force majeure events, or (8) any other matter beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless Vantirs, its officers, directors, employees, agents, affiliates, licensors, and service providers from and against any and all claims, demands, losses, liabilities, damages, costs, and expenses (including reasonable attorneys' fees and costs) arising out of or relating to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms or any applicable laws or regulations</li>
              <li>Your violation of any third-party rights (including intellectual property, privacy, or data protection rights)</li>
              <li>Any disputes you submit through the Service or any disputes related to your business or transactions</li>
              <li>Your negligence, willful misconduct, or fraudulent activity</li>
              <li>Any content, data, or information you provide or transmit through the Service</li>
              <li>Your breach of any representation, warranty, or covenant in these Terms</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right, at your expense, to assume the exclusive defense and control of any matter subject to indemnification by you. You agree to cooperate with our defense of such claims. You may not settle any claim without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Either party may terminate this Agreement at any time:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>By You:</strong> You may cancel your subscription and terminate your account at any time through your account settings or by contacting us</li>
                <li><strong>By Us:</strong> We may suspend or terminate your account immediately, with or without notice, for: (a) violation of these Terms, (b) non-payment, (c) fraudulent or illegal activity, (d) abuse of the Service, (e) any reason at our sole discretion</li>
                <li><strong>Service Termination:</strong> We may discontinue or terminate the Service or any part thereof with 30 days' notice</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Upon termination:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Your right to access and use the Service will immediately cease</li>
                <li>All outstanding fees and charges become immediately due and payable</li>
                <li>We will delete or anonymize your data in accordance with our Privacy Policy, except where retention is required by law</li>
                <li>Provisions that by their nature should survive termination (including disclaimers, limitations of liability, and indemnification) will survive</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Dispute Resolution and Arbitration</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed font-semibold mb-2">Binding Arbitration:</p>
              <p className="text-gray-700 leading-relaxed">
                Any dispute, controversy, or claim arising out of or relating to these Terms, the Service, or the relationship between you and Vantirs shall be resolved exclusively through binding arbitration in accordance with the rules of the American Arbitration Association (AAA), except that you may assert claims in small claims court if your claims qualify. Arbitration shall be conducted in Delaware, United States, and shall be conducted in English.
              </p>
              
              <p className="text-gray-700 leading-relaxed font-semibold mb-2 mt-4">Class Action Waiver:</p>
              <p className="text-gray-700 leading-relaxed">
                You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration.
              </p>

              <p className="text-gray-700 leading-relaxed font-semibold mb-2 mt-4">Exceptions:</p>
              <p className="text-gray-700 leading-relaxed">
                This arbitration agreement does not prevent you from: (1) bringing issues to the attention of federal, state, or local agencies, (2) seeking injunctive relief in a court of competent jurisdiction to prevent irreparable harm, or (3) filing a claim in small claims court if your claims qualify.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law and Jurisdiction</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any legal action or proceeding arising out of or relating to these Terms or the Service (except for arbitration as provided above) shall be brought exclusively in the federal or state courts located in Delaware, and you consent to the personal jurisdiction of such courts.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Force Majeure</h2>
            <p className="text-gray-700 leading-relaxed">
              We shall not be liable for any failure or delay in performance under these Terms due to circumstances beyond our reasonable control, including but not limited to: natural disasters, war, terrorism, pandemics, government actions, strikes, labor disputes, internet or telecommunications failures, cyberattacks, or failures of third-party services. In such events, we will use reasonable efforts to resume performance as soon as practicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Export Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service may be subject to export control laws and regulations. You agree to comply with all applicable export and import laws and regulations. You represent that you are not located in a country that is subject to a U.S. government embargo or that has been designated by the U.S. government as a "terrorist supporting" country, and you are not listed on any U.S. government list of prohibited or restricted parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be notified by: (1) posting the updated Terms on this page with a new "Last updated" date, (2) sending you an email notification (if you have provided an email address), or (3) displaying a prominent notice on our Service. Your continued use of the Service after such changes constitutes acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Service and may terminate your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding these Terms, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> <a href="mailto:anixagency7@gmail.com" className="text-blue-600 hover:underline">anixagency7@gmail.com</a>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Website:</strong> <Link href="/" className="text-blue-600 hover:underline">vantirs.com</Link>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Entire Agreement and Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and Vantirs regarding the Service and supersede all prior or contemporaneous agreements, understandings, negotiations, representations, and proposals, whether written or oral, relating to the Service.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall remain in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Waiver and Assignment</h2>
            <p className="text-gray-700 leading-relaxed">
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. No waiver shall be effective unless in writing and signed by us. You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.
            </p>
          </section>

          <section className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Acknowledgment</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> • <Link href="/security" className="text-blue-600 hover:underline">Security</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
