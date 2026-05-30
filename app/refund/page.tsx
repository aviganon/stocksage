'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

const CONTENT: Record<string, { title: string; updated: string; sections: { h: string; p: string }[] }> = {
  he: { title: 'מדיניות החזרים', updated: 'עדכון אחרון: מאי 2026', sections: [
    { h: 'מדיניות כללית', p: 'מכיוון שהשירות דיגיטלי ומסופק מיידית, אין החזר לאחר שהמחקר החל.' },
    { h: 'מקרים זכאים להחזר', p: 'חיוב כפול, תקלה טכנית שמנעה השלמת הדוח, או חיוב שגוי.' },
    { h: 'בקשת החזר', p: 'שלח מייל ל-support@stocksage.io עם: אימייל החשבון, תאריך ומזהה העסקה, תיאור הבעיה. נגיב תוך 3 ימי עסקים.' },
    { h: 'עיבוד ההחזר', p: 'החזרים מאושרים יעובדו דרך Paddle תוך 5-10 ימי עסקים.' },
  ]},
  en: { title: 'Refund Policy', updated: 'Last updated: May 2026', sections: [
    { h: 'General Policy', p: 'Since the service is digital and delivered immediately, no refund is given after research has begun.' },
    { h: 'Eligible Refund Cases', p: 'Double charge, technical failure preventing report completion, or incorrect charge.' },
    { h: 'Requesting a Refund', p: 'Email support@stocksage.io with: account email, transaction date and ID, description of the issue. We respond within 3 business days.' },
    { h: 'Refund Processing', p: 'Approved refunds are processed through Paddle within 5-10 business days.' },
  ]},
  ru: { title: 'Политика возврата', updated: 'Последнее обновление: май 2026', sections: [
    { h: 'Общая политика', p: 'Поскольку сервис цифровой и предоставляется немедленно, возврат средств после начала исследования не производится.' },
    { h: 'Случаи возврата', p: 'Двойное списание, техническая ошибка, препятствующая завершению отчёта, или неверное списание.' },
    { h: 'Запрос возврата', p: 'Напишите на support@stocksage.io с указанием: email аккаунта, даты и ID транзакции, описания проблемы. Ответим в течение 3 рабочих дней.' },
    { h: 'Обработка возврата', p: 'Одобренные возвраты обрабатываются через Paddle в течение 5-10 рабочих дней.' },
  ]},
  fr: { title: 'Politique de remboursement', updated: 'Dernière mise à jour: mai 2026', sections: [
    { h: 'Politique générale', p: "Le service étant numérique et fourni immédiatement, aucun remboursement n'est accordé après le début de la recherche." },
    { h: 'Cas éligibles', p: 'Double facturation, panne technique empêchant la complétion du rapport, ou facturation incorrecte.' },
    { h: 'Demande de remboursement', p: 'Envoyez un email à support@stocksage.io avec: email du compte, date et ID de transaction, description du problème. Réponse sous 3 jours ouvrables.' },
    { h: 'Traitement', p: 'Les remboursements approuvés sont traités via Paddle sous 5-10 jours ouvrables.' },
  ]},
  ar: { title: 'سياسة الاسترداد', updated: 'آخر تحديث: مايو 2026', sections: [
    { h: 'السياسة العامة', p: 'نظراً لأن الخدمة رقمية وتُسلَّم فوراً، لا يُجرى استرداد بعد بدء البحث.' },
    { h: 'حالات الاسترداد', p: 'الازدواج في الفوترة، عطل تقني يمنع اكتمال التقرير، أو تحصيل خاطئ.' },
    { h: 'طلب الاسترداد', p: 'أرسل بريداً إلى support@stocksage.io مع: بريد الحساب، تاريخ ومعرّف المعاملة، وصف المشكلة. نرد خلال 3 أيام عمل.' },
    { h: 'معالجة الاسترداد', p: 'تُعالَج المبالغ المستردة عبر Paddle خلال 5-10 أيام عمل.' },
  ]},
};

export default function RefundPage() {
  const { locale, dir } = useI18n();
  const c = CONTENT[locale] ?? CONTENT.he;
  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={dir}>
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" dir="ltr" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">{c.title}</h1>
        <p className="text-gray-500 text-sm mb-10">{c.updated}</p>
        <div className="space-y-8 text-gray-300 leading-relaxed">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-white mb-3">{s.h}</h2>
              <p>{s.p}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-white/8 flex gap-4 text-xs text-gray-600">
          <Link href="/terms" className="hover:text-gray-400 transition-colors">{locale === 'en' ? 'Terms' : 'תנאים'}</Link>
          <Link href="/" className="hover:text-gray-400 transition-colors">{locale === 'en' ? 'Home' : 'דף הבית'}</Link>
        </div>
      </div>
    </div>
  );
}
