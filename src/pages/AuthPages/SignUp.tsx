import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Create Account"
        description="Create a NovaMetrics AI workspace account."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
