import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="NovaMetrics AI | Sign In"
        description="Sign in to the NovaMetrics AI analytics workspace."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
