import { useState, useCallback } from "react";
import { submitQuery, submitImageQuery } from "../utils/api";

export function useKrishiAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = useCallback(async ({
    query,
    language = "hi",
    location = "Rewa, Madhya Pradesh",
    cropType = "",
    imageFile = null,
    soilData = null,
  }) => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let data;

      if (imageFile) {
        data = await submitImageQuery({
          imageFile,
          query,
          location,
          cropType,
          language,
        });
      } else {
        data = await submitQuery({
          query,
          language,
          location,
          cropType,
          soilData,
        });
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, result, error, submit, reset };
}