import { lazy, Suspense } from "react";
import RouteErrorBoundary from "./components/ui/RouteErrorBoundary.jsx";
import { RouteLoading } from "./components/ui/Feedback.jsx";
import { Routes, Route } from "react-router-dom";
import MarketingLayout from "./layouts/MarketingLayout.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
const LandingPage = lazy(() => import("./pages/marketing/LandingPage.jsx"));
const PricingPage = lazy(() => import("./pages/marketing/PricingPage.jsx"));
const PlatformPage = lazy(() => import("./pages/marketing/PlatformPage.jsx"));
const ExplorePage = lazy(() => import("./pages/marketing/ExplorePage.jsx"));
const HowItWorksPage = lazy(() => import("./pages/marketing/HowItWorksPage.jsx"));
const SkillIntelligencePage = lazy(() => import("./pages/marketing/SkillIntelligencePage.jsx"));
const RoadmapsPage = lazy(() => import("./pages/marketing/RoadmapsPage.jsx"));
import ScrollToHash from "./components/marketing/ScrollToHash.jsx";
import SeoManager from "./components/SeoManager.jsx";
const LoginPage = lazy(() => import("./pages/auth/LoginPage.jsx"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage.jsx"));
const DashboardPage = lazy(() => import("./pages/app/DashboardPage.jsx"));
const SkillAnalysisPage = lazy(() => import("./pages/app/SkillAnalysisPage.jsx"));
const RoadmapPage = lazy(() => import("./pages/app/RoadmapPage.jsx"));
const ProjectsPage = lazy(() => import("./pages/app/ProjectsPage.jsx"));
const ProjectDetailsPage = lazy(() => import("./pages/app/ProjectDetailsPage.jsx"));
const DailyMissionsPage = lazy(() => import("./pages/app/DailyMissionsPage.jsx"));
const ChallengesPage = lazy(() => import("./pages/app/ChallengesPage.jsx"));
const ChallengeDetailsPage = lazy(() => import("./pages/app/ChallengeDetailsPage.jsx"));
const ProgressPage = lazy(() => import("./pages/app/ProgressPage.jsx"));
const PortfolioPage = lazy(() => import("./pages/app/PortfolioPage.jsx"));
const PublicPortfolioPage = lazy(() => import("./pages/public/PublicPortfolioPage.jsx"));
const CareersPage = lazy(() => import("./pages/careers/CareersPage.jsx"));
const CareerDetailsPage = lazy(() => import("./pages/careers/CareerDetailsPage.jsx"));
const CareerMatchPage = lazy(() => import("./pages/careers/CareerMatchPage.jsx"));
const OnboardingPage = lazy(() => import("./pages/onboarding/OnboardingPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
import OwnerRoute from "./components/auth/OwnerRoute.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import OnboardingRoute from "./components/auth/OnboardingRoute.jsx";
import RequireOnboarding from "./components/auth/RequireOnboarding.jsx";

const SkillsPage = lazy(() => import("./pages/skills/SkillsPage.jsx"));
const SkillDetailPage = lazy(() => import("./pages/skills/SkillDetailPage.jsx"));
const SettingsPage = lazy(() => import("./pages/app/SettingsPage.jsx"));
const CoursesPage = lazy(() => import("./pages/courses/CoursesPage.jsx"));
const CourseDetailPage = lazy(() => import("./pages/courses/CourseDetailPage.jsx"));
const MyLearningPage = lazy(() => import("./pages/courses/MyLearningPage.jsx"));
const CourseAdminPage = lazy(() => import("./pages/courses/CourseAdminPage.jsx"));
const AssessmentsPage = lazy(() => import("./pages/assessments/AssessmentsPage.jsx"));
const QuizPage = lazy(() => import("./pages/assessments/QuizPage.jsx"));
const AssessmentHistoryPage = lazy(() => import("./pages/assessments/AssessmentHistoryPage.jsx"));
const QuizAdminPage = lazy(() => import("./pages/assessments/QuizAdminPage.jsx"));
const ProjectEvidencePage = lazy(() => import("./pages/submissions/ProjectEvidencePage.jsx"));
const MySubmissionsPage = lazy(() => import("./pages/submissions/MySubmissionsPage.jsx"));
const ReviewQueuePage = lazy(() => import("./pages/submissions/ReviewQueuePage.jsx"));
const ReviewSubmissionPage = lazy(() => import("./pages/submissions/ReviewSubmissionPage.jsx"));
const EvidenceReadinessPage = lazy(() => import("./pages/app/EvidenceReadinessPage.jsx"));
const CertificatesPage = lazy(() => import("./pages/app/CertificatesPage.jsx"));
const CertificateVerificationPage = lazy(() => import("./pages/public/CertificateVerificationPage.jsx"));
const StorePage = lazy(() => import("./pages/app/StorePage.jsx"));
const PurchasesPage = lazy(() => import("./pages/app/PurchasesPage.jsx"));
const CheckoutPage = lazy(() => import("./pages/app/CheckoutPage.jsx"));
const PaymentResultPage = lazy(() => import("./pages/app/PaymentResultPage.jsx"));
const ReceiptPage = lazy(() => import("./pages/app/ReceiptPage.jsx"));
const ReferralWalletPage = lazy(() => import("./pages/app/ReferralWalletPage.jsx"));
const AdminPage = lazy(() => import("./pages/app/AdminPage.jsx"));
const LegalPage = lazy(() => import("./pages/marketing/LegalPage.jsx"));

const PurchaseConfirmPage = lazy(() => import("./pages/app/PurchaseConfirmPage.jsx"));
const ProductLearningPage = lazy(() => import("./pages/app/ProductLearningPage.jsx"));

function App() {
  return (
    <>
      <ScrollToHash />
      <SeoManager />
      <RouteErrorBoundary><Suspense fallback={<RouteLoading />}><Routes>
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/skills/:id" element={<SkillDetailPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/learning" element={<ProtectedRoute><MyLearningPage /></ProtectedRoute>} />
      <Route path="/course-admin" element={<ProtectedRoute><OwnerRoute><CourseAdminPage /></OwnerRoute></ProtectedRoute>} />
      <Route path="/assessments" element={<AssessmentsPage />} />
      <Route path="/assessments/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      <Route path="/assessment-history" element={<ProtectedRoute><AssessmentHistoryPage /></ProtectedRoute>} />
      <Route path="/quiz-admin" element={<ProtectedRoute><OwnerRoute><QuizAdminPage /></OwnerRoute></ProtectedRoute>} />
      <Route path="/projects/:id/evidence" element={<ProtectedRoute><ProjectEvidencePage /></ProtectedRoute>} />
      <Route path="/submissions" element={<ProtectedRoute><MySubmissionsPage /></ProtectedRoute>} />
      <Route path="/project-reviews" element={<ProtectedRoute><OwnerRoute><ReviewQueuePage /></OwnerRoute></ProtectedRoute>} />
      <Route path="/project-reviews/:id" element={<ProtectedRoute><OwnerRoute><ReviewSubmissionPage /></OwnerRoute></ProtectedRoute>} />
      <Route path="/readiness" element={<ProtectedRoute><RequireOnboarding><EvidenceReadinessPage /></RequireOnboarding></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
      <Route path="/certificates/verify/:code" element={<CertificateVerificationPage />} />
      <Route path="/store" element={<StorePage />} />
      <Route path="/purchase/:id/confirm" element={<ProtectedRoute><PurchaseConfirmPage /></ProtectedRoute>} />
      <Route path="/my-access/:id" element={<ProtectedRoute><ProductLearningPage /></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
      <Route path="/checkout/:id" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/checkout/:id/success" element={<ProtectedRoute><PaymentResultPage success /></ProtectedRoute>} />
      <Route path="/checkout/:id/failure" element={<ProtectedRoute><PaymentResultPage success={false} /></ProtectedRoute>} />
      <Route path="/receipts/:id" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><ReferralWalletPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><OwnerRoute><AdminPage /></OwnerRoute></ProtectedRoute>} />
      <Route path="/career-match" element={<ProtectedRoute><RequireOnboarding><CareerMatchPage /></RequireOnboarding></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/platform" element={<PlatformPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/skill-intelligence" element={<SkillIntelligencePage />} />
        <Route path="/roadmaps" element={<RoadmapsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/refunds" element={<LegalPage type="refunds" />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <DashboardPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/skill-analysis"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <SkillAnalysisPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/roadmap"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <RoadmapPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <ProjectsPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/challenges"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <ChallengesPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/challenges/:id"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <ChallengeDetailsPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/missions"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <DailyMissionsPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <ProgressPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <PortfolioPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route path="/u/:slug" element={<PublicPortfolioPage />} />

      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <ProjectDetailsPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/careers"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <CareersPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route
        path="/careers/:id"
        element={
          <ProtectedRoute>
            <RequireOnboarding>
              <CareerDetailsPage />
            </RequireOnboarding>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
      </Routes></Suspense></RouteErrorBoundary>
    </>
  );
}

export default App;
