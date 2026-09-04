"use client";

import { useState } from "react";

import ImageUploader from "../../src/components/ImageUploader";

import { scanProduct } from "../../src/lib/api";


export default function ScanPage() {

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);

  const [error, setError] =
    useState<string | null>(null);


  const handleImageSelect = (
    file: File
  ) => {

    setSelectedFile(file);

    setResult(null);

    setError(null);
  };


  const handleAnalyze = async () => {

    if (!selectedFile) {

      setError(
        "Please select a product image first."
      );

      return;
    }


    try {

      setLoading(true);

      setError(null);

      const data =
        await scanProduct(selectedFile);

      setResult(data);

    } catch (err: any) {

      setError(
        err.message ||
        "Something went wrong."
      );

    } finally {

      setLoading(false);

    }
  };


  return (

    <main className="min-h-screen bg-slate-100">

      <div className="mx-auto max-w-6xl p-8">

        <div className="mb-8">

          <p className="font-semibold text-blue-600">
            AI POWERED INSPECTION
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Scan Packaged Commodity
          </h1>

          <p className="mt-3 text-slate-600">
            Upload a product image and let
            MetraScan AI analyze mandatory
            Legal Metrology declarations.
          </p>

        </div>


        <div className="grid gap-8 lg:grid-cols-2">


          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold">
              Product Image
            </h2>

            <ImageUploader
              onImageSelect={handleImageSelect}
            />


            <button
              onClick={handleAnalyze}
              disabled={
                !selectedFile || loading
              }
              className="
                mt-6
                w-full
                rounded-xl
                bg-blue-600
                px-6
                py-4
                font-bold
                text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:bg-gray-400
              "
            >

              {loading
                ? "Analyzing Product..."
                : "Analyze with AI"}

            </button>

          </div>


          <div className="rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold">
              Analysis Result
            </h2>


            {!result && !loading && !error && (

              <div
                className="
                  flex
                  min-h-[300px]
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-dashed
                  text-center
                  text-gray-400
                "
              >

                Upload a product image and click
                Analyze with AI.

              </div>

            )}


            {loading && (

              <div
                className="
                  flex
                  min-h-[300px]
                  flex-col
                  items-center
                  justify-center
                "
              >

                <div
                  className="
                    h-12
                    w-12
                    animate-spin
                    rounded-full
                    border-4
                    border-blue-200
                    border-t-blue-600
                  "
                />

                <p className="mt-5 font-medium">
                  Processing image...
                </p>

              </div>

            )}


            {error && (

              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-5
                  text-red-700
                "
              >

                {error}

              </div>

            )}


            {result && (

              <div>

                <div
                  className="
                    rounded-xl
                    bg-green-50
                    p-4
                    text-green-700
                  "
                >

                  ✓ Image successfully received
                  by MetraScan AI

                </div>


                <pre
                  className="
                    mt-5
                    max-h-[400px]
                    overflow-auto
                    rounded-xl
                    bg-slate-900
                    p-5
                    text-sm
                    text-green-400
                  "
                >

                  {JSON.stringify(
                    result,
                    null,
                    2
                  )}

                </pre>

              </div>

            )}

          </div>

        </div>

      </div>

    </main>

  );
}