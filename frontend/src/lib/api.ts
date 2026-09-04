const API_URL = "http://127.0.0.1:8000";


export async function scanProduct(
  file: File
) {
  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const response = await fetch(
    `${API_URL}/api/scan`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {

    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
      "Failed to scan product"
    );
  }

  return response.json();
}


/**
 * Generate a branded Logic Legends
 * MetraScan AI PDF report.
 */
export async function generatePDFReport(
  file: File,
  reportData: any
): Promise<Blob> {

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "report_data",
    JSON.stringify(
      reportData
    )
  );

  const response =
    await fetch(
      `${API_URL}/api/reports/generate`,
      {
        method: "POST",
        body: formData,
      }
    );

  if (!response.ok) {

    const error =
      await response
        .json()
        .catch(() => null);

    throw new Error(
      error?.detail ||
      "Failed to generate PDF report"
    );
  }

  return response.blob();
}

/**
 * Legal Metrology Notices API
 */
export async function fetchAllNotices() {
  try {
    const res = await fetch(`${API_URL}/api/notices/all`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend notice fetch failed, falling back to client store:", e);
  }
  return null;
}

export async function fetchCompanyNotices(companyId: string) {
  try {
    const res = await fetch(`${API_URL}/api/notices/company/${companyId}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend notice fetch failed, falling back to client store:", e);
  }
  return null;
}

export async function dispatchNoticeAPI(noticeData: any) {
  try {
    const res = await fetch(`${API_URL}/api/notices/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noticeData),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend dispatch failed, using client store:", e);
  }
  return null;
}

export async function fetchNoticeStats() {
  try {
    const res = await fetch(`${API_URL}/api/notices/stats`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Stats fetch failed:", e);
  }
  return null;
}