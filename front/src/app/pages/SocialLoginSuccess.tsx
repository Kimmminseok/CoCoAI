import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { setToken, getMyLearningSetting } from "../lib/dataSource";

export default function SocialLoginSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setToken(token);

    const moveNext = async () => {
      try {
        await getMyLearningSetting();
        navigate("/dashboard", { replace: true });
      } catch {
        navigate("/dashboard/learning-settings", { replace: true });
      }
    };

    moveNext();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-purple-700">SNS 로그인 처리 중...</p>
    </div>
  );
}
