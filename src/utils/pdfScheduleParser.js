// PDF support removed - use CSV/Excel for reliable schedule imports
// CSV/Excel is the recommended and primary import method
export async function extractPDFText() {
  throw new Error('PDF import is not available. Please use CSV or Excel files instead.');
}