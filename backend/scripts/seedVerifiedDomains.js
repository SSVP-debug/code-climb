/**
 * seedVerifiedDomains.js
 *
 * Preloads VerifiedDomain with a starter allowlist so Recruiter/TPO signups
 * from these domains are auto-verified instantly instead of sitting in the
 * admin approval queue. This is a starter list, not a ceiling — add more
 * anytime by re-running this script with an updated array, or (once built)
 * via the admin console's "always trust this domain" action.
 *
 * Idempotent — upserts on `domain`, safe to re-run after edits.
 *
 * Usage:
 *   cd backend
 *   node scripts/seedVerifiedDomains.js
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import VerifiedDomain from "../models/VerifiedDomain.js";

// ── Starter allowlist ────────────────────────────────────────────────────
// Keep this list conservative — the cost of missing a legitimate domain is
// low (falls into the manual queue, one click to approve), the cost of a
// wrong auto-verify is high (unverified recruiter/college gets instant
// access). Expand over time from the admin queue, not by guessing upfront.
const COMPANY_DOMAINS = [
  ["google.com", "Google"],
  ["microsoft.com", "Microsoft"],
  ["amazon.com", "Amazon"],
  ["meta.com", "Meta"],
  ["apple.com", "Apple"],
  ["adobe.com", "Adobe"],
  ["salesforce.com", "Salesforce"],
  ["oracle.com", "Oracle"],
  ["ibm.com", "IBM"],
  ["sap.com", "SAP"],
  ["intel.com", "Intel"],
  ["nvidia.com", "NVIDIA"],
  ["flipkart.com", "Flipkart"],
  ["swiggy.in", "Swiggy"],
  ["zomato.com", "Zomato"],
  ["paytm.com", "Paytm"],
  ["phonepe.com", "PhonePe"],
  ["razorpay.com", "Razorpay"],
  ["freshworks.com", "Freshworks"],
  ["zoho.com", "Zoho"],
  ["infosys.com", "Infosys"],
  ["tcs.com", "TCS"],
  ["wipro.com", "Wipro"],
  ["accenture.com", "Accenture"],
  ["cognizant.com", "Cognizant"],
  ["hcltech.com", "HCLTech"],
  ["deloitte.com", "Deloitte"],
  ["goldmansachs.com", "Goldman Sachs"],
  ["jpmorgan.com", "JPMorgan Chase"],
  ["walmartglobaltech.com", "Walmart Global Tech"],
  ["uber.com", "Uber"],
  ["atlassian.com", "Atlassian"],
];

const COLLEGE_DOMAINS = [
  ["iitb.ac.in", "IIT Bombay"],
  ["iitd.ac.in", "IIT Delhi"],
  ["iitm.ac.in", "IIT Madras"],
  ["iitk.ac.in", "IIT Kanpur"],
  ["iitkgp.ac.in", "IIT Kharagpur"],
  ["iitr.ac.in", "IIT Roorkee"],
  ["iitg.ac.in", "IIT Guwahati"],
  ["iitbhu.ac.in", "IIT (BHU) Varanasi"],
  ["iiit.ac.in", "IIIT Hyderabad"],
  ["nitt.edu", "NIT Trichy"],
  ["nitk.edu.in", "NIT Karnataka (Surathkal)"],
  ["nitw.ac.in", "NIT Warangal"],
  ["nitrkl.ac.in", "NIT Rourkela"],
  ["bitsathy.ac.in", "Bannari Amman Institute of Technology"],
  ["bits-pilani.ac.in", "BITS Pilani"],
  ["vit.ac.in", "VIT Vellore"],
  ["srmist.edu.in", "SRM Institute of Science and Technology"],
  ["pes.edu", "PES University"],
  ["rvce.edu.in", "RV College of Engineering"],
  ["dtu.ac.in", "Delhi Technological University"],
  ["nsut.ac.in", "Netaji Subhas University of Technology"],
];

async function seedVerifiedDomains() {
  await connectDB();

  const rows = [
    ...COMPANY_DOMAINS.map(([domain, name]) => ({ domain, name, type: "company" })),
    ...COLLEGE_DOMAINS.map(([domain, name]) => ({ domain, name, type: "college" })),
  ];

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const result = await VerifiedDomain.updateOne(
      { domain: row.domain },
      { $set: { name: row.name, type: row.type }, $setOnInsert: { addedBy: "seed" } },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      created++;
      console.log(`  + added   ${row.domain}  (${row.name})`);
    } else if (result.modifiedCount > 0) {
      updated++;
      console.log(`  ~ updated ${row.domain}  (${row.name})`);
    }
  }

  console.log(`\nDone. ${created} added, ${updated} updated, ${rows.length} total in list.`);
  await mongoose.disconnect();
}

seedVerifiedDomains().catch((err) => {
  console.error("[seedVerifiedDomains] failed:", err);
  process.exit(1);
});