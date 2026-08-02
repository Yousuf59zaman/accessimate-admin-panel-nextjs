import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Accessibility Widget',
  description:
    'Public Accessimate widget demonstration running the original dev-branch widget against the independent NestJS and PostgreSQL backend.',
};

export default function AccessibilityWidgetPage() {
  return (
    <main className="h-dvh min-h-[36rem] bg-slate-100">
      <iframe
        title="Original Accessimate accessibility widget demonstration"
        src="/widget/index.html"
        className="h-full w-full border-0 bg-white"
      />
    </main>
  );
}
