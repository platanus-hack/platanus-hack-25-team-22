import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/api";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";

export interface PatientRecord {
  _id: string;
  _creationTime: number;
  profilePicture?: string;
  firstName: string;
  lastName: string;
  bloodType?: string;
  visitNotes?: string;
}

export async function searchPatientRecord(
  firstName?: string,
  lastName?: string
): Promise<PatientRecord | null> {
  if (!convexUrl) {
    console.warn("⚠️ Convex URL not configured. Cannot search patient records.");
    return null;
  }

  try {
    const client = new ConvexHttpClient(convexUrl);

    console.log(`🔍 Searching patient records: firstName="${firstName}", lastName="${lastName}"`);

    const results = await client.query(api.known_patient_records.searchByName, {
      firstName,
      lastName,
    });

    console.log(`   Found ${results?.length || 0} patient records`);

    if (results && results.length > 0) {
      console.log(`✅ Selected patient record:`, results[0]);
      return results[0] as PatientRecord;
    }

    console.log(`⚠️ No patient records found`);
    return null;
  } catch (error) {
    console.error("❌ Error searching patient record:", error);
    return null;
  }
}
