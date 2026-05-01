import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EmployeeCalendar() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/calendar?filter=employee", { replace: true });
  }, [navigate]);
  return null;
}

export const hideBase44Index = true;