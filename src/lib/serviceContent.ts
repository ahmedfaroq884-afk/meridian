import type { Language } from "./types";

export interface ServiceDetailContent {
  eyebrow: string;
  title: string;
  lead: string;
  section: string;
  body: string;
  points: [string, string, string];
  boundary: string;
}

type ServicePath = "/company-setup" | "/pvip" | "/mm2h" | "/banking" | "/market-entry";

export const serviceContent: Record<Language, Record<ServicePath, ServiceDetailContent>> = {
  en: {
    "/company-setup": {
      eyebrow: "Company formation",
      title: "Choose a company structure around the work it needs to do.",
      lead: "We help founders organise the decisions and local questions involved in establishing a Malaysian company.",
      section: "Start with the operating plan.",
      body: "The right structure depends on the proposed activity, ownership, decision-making and regional plans. We help you set out those points before coordinating the relevant company-secretarial, legal or tax conversations.",
      points: ["Define the planned activity, customers and ownership.", "List the information required for an incorporation discussion.", "Separate coordination tasks from legal, tax and regulatory advice."],
      boundary: "Companies Commission of Malaysia and other authorities determine registration and regulatory outcomes. We coordinate information; we do not provide legal or tax advice.",
    },
    "/pvip": {
      eyebrow: "Premium Visa Programme",
      title: "Review the published PVIP requirements before deciding whether to apply.",
      lead: "We help you understand the programme information available to the public and prepare questions for an independent immigration adviser.",
      section: "Check the current programme information.",
      body: "Programme rules, eligibility criteria and application processes can change. Before relying on a summary, check the latest information from the relevant Malaysian authority and ask a qualified independent adviser how it applies to you.",
      points: ["Confirm the current published criteria and required evidence.", "Discuss your circumstances with an independent immigration professional.", "Decide independently whether to proceed with an application."],
      boundary: "Meridian Malaysia is not an immigration authority or law firm. We do not determine eligibility or promise a visa, residency or approval outcome.",
    },
    "/mm2h": {
      eyebrow: "Malaysia My Second Home",
      title: "Compare current MM2H information with your own plans.",
      lead: "We help organise questions about long-stay planning and coordinate independent advice where appropriate.",
      section: "Requirements depend on your circumstances.",
      body: "MM2H categories, financial conditions and administrative requirements may change. Review the current published terms and speak with an independent professional before making financial or relocation decisions.",
      points: ["Identify the category and timing you want to ask about.", "Check current published financial and supporting-document requirements.", "Discuss personal suitability with an independent adviser."],
      boundary: "We provide information and coordination only. We are not affiliated with programme administrators and cannot promise eligibility or approval.",
    },
    "/banking": {
      eyebrow: "Banking preparation",
      title: "Go into a bank discussion with a clear business profile.",
      lead: "We help you organise the information a financial institution may ask about before you approach it.",
      section: "Each institution decides independently.",
      body: "Banks set their own account, onboarding, due-diligence and acceptance requirements. Preparation can make your business activity and expected use clearer, but it cannot replace a bank's review.",
      points: ["Describe the business, ownership and operating countries.", "Outline expected transactions and the account's intended use.", "Ask each institution about its current documents and process."],
      boundary: "We do not represent a bank, provide financial advice or promise an introduction, account or approval.",
    },
    "/market-entry": {
      eyebrow: "Market entry",
      title: "Test the assumptions behind your Malaysia market plan.",
      lead: "We help businesses organise early research and identify which local questions need a direct answer.",
      section: "Build a useful first market map.",
      body: "A practical entry plan starts with the customer, the route to market and the operating model. We help identify the research gaps and coordinate conversations with independent service providers where appropriate.",
      points: ["Define target customers and how you expect to reach them.", "List local operating, hiring, supply and partner questions.", "Identify where local research or professional advice is still needed."],
      boundary: "Market-entry coordination is not a substitute for legal, tax, financial or regulatory advice. Business decisions and outcomes remain with you and the relevant authorities.",
    },
  },
  ar: {
    "/company-setup": {
      eyebrow: "تأسيس الشركات",
      title: "اختر هيكل الشركة وفقاً للنشاط الذي ستقوم به.",
      lead: "نساعد مؤسسي الشركات على ترتيب القرارات والأسئلة المحلية المرتبطة بإنشاء شركة في ماليزيا.",
      section: "ابدأ بخطة التشغيل.",
      body: "يعتمد الهيكل المناسب على النشاط والملكية وطريقة اتخاذ القرارات والخطط الإقليمية. نساعدك على توضيح هذه الجوانب قبل تنسيق التواصل مع مختصين مستقلين في شؤون الشركات أو القانون أو الضرائب.",
      points: ["حدّد النشاط والعملاء والملكية المقترحة.", "أعد قائمة بالمعلومات اللازمة لمناقشة التأسيس.", "ميّز بين مهام التنسيق والمشورة القانونية والضريبية والتنظيمية."],
      boundary: "تحدد لجنة الشركات الماليزية والجهات الأخرى نتائج التسجيل والتنظيم. ننسق المعلومات ولا نقدم مشورة قانونية أو ضريبية.",
    },
    "/pvip": {
      eyebrow: "برنامج تأشيرة الإقامة المميزة",
      title: "راجع متطلبات PVIP المنشورة قبل أن تقرر التقديم.",
      lead: "نساعدك على فهم المعلومات المتاحة للجمهور وإعداد أسئلة لمستشار هجرة مستقل.",
      section: "تحقق من معلومات البرنامج الحالية.",
      body: "قد تتغير قواعد البرنامج ومعايير الأهلية وإجراءات الطلب. راجع أحدث المعلومات لدى الجهة الماليزية المعنية، واسأل مستشاراً مستقلاً مؤهلاً عن كيفية انطباقها على حالتك.",
      points: ["تحقق من المعايير المنشورة حالياً والأدلة المطلوبة.", "ناقش ظروفك مع مختص مستقل في شؤون الهجرة.", "قرر بنفسك ما إذا كنت ستتابع تقديم الطلب."],
      boundary: "ميريديان ماليزيا ليست جهة هجرة أو مكتب محاماة. لا نحدد الأهلية ولا نعد بتأشيرة أو إقامة أو موافقة.",
    },
    "/mm2h": {
      eyebrow: "برنامج ماليزيا بيتي الثاني",
      title: "قارن معلومات MM2H الحالية بخططك الشخصية.",
      lead: "نساعدك على ترتيب أسئلة الإقامة الطويلة وتنسيق المشورة المستقلة عند الاقتضاء.",
      section: "تعتمد المتطلبات على ظروفك.",
      body: "قد تتغير فئات MM2H والشروط المالية والمتطلبات الإدارية. راجع الشروط المنشورة حالياً واستشر مختصاً مستقلاً قبل اتخاذ قرارات مالية أو متعلقة بالانتقال.",
      points: ["حدّد الفئة والجدول الزمني اللذين تريد الاستفسار عنهما.", "تحقق من الشروط المالية والوثائق المنشورة حالياً.", "ناقش ملاءمة البرنامج لظروفك مع مستشار مستقل."],
      boundary: "نقدم المعلومات والتنسيق فقط. لا نتبع لمديري البرنامج ولا نعد بالأهلية أو الموافقة.",
    },
    "/banking": {
      eyebrow: "الاستعداد للتواصل المصرفي",
      title: "ادخل اجتماع البنك بملف أعمال واضح.",
      lead: "نساعدك على تنظيم المعلومات التي قد تطلبها المؤسسة المالية قبل التواصل معها.",
      section: "لكل مؤسسة قرارها المستقل.",
      body: "تحدد البنوك متطلباتها الخاصة بفتح الحسابات والانضمام والعناية الواجبة والقبول. قد يساعد التحضير على توضيح نشاط الشركة والاستخدام المتوقع، لكنه لا يغني عن مراجعة البنك.",
      points: ["اشرح نشاط الشركة وملكيتها والدول التي تعمل فيها.", "وضّح المعاملات المتوقعة والغرض من الحساب.", "اسأل كل مؤسسة عن وثائقها وإجراءاتها الحالية."],
      boundary: "لا نمثل أي بنك ولا نقدم مشورة مالية ولا نعد بتواصل أو حساب أو موافقة.",
    },
    "/market-entry": {
      eyebrow: "دخول السوق",
      title: "اختبر الافتراضات التي تقوم عليها خطتك في ماليزيا.",
      lead: "نساعد الشركات على تنظيم البحث الأولي وتحديد الأسئلة المحلية التي تحتاج إلى إجابات مباشرة.",
      section: "ارسم خريطة أولية مفيدة للسوق.",
      body: "تبدأ خطة الدخول العملية من العميل ومسار الوصول إليه ونموذج التشغيل. نساعدك على تحديد ما ينقصك من بحث وتنسيق التواصل مع مزودي خدمات مستقلين عند الاقتضاء.",
      points: ["حدّد العملاء المستهدفين وكيفية الوصول إليهم.", "اكتب أسئلة التشغيل والتوظيف والتوريد والشركاء المحليين.", "حدّد ما يحتاج إلى بحث محلي أو مشورة مهنية."],
      boundary: "لا يحل تنسيق دخول السوق محل المشورة القانونية أو الضريبية أو المالية أو التنظيمية. تبقى القرارات لك وللجهات المختصة.",
    },
  },
  ms: {
    "/company-setup": {
      eyebrow: "Penubuhan syarikat",
      title: "Pilih struktur syarikat berdasarkan kegiatan yang akan dijalankan.",
      lead: "Kami membantu pengasas menyusun keputusan dan persoalan tempatan sebelum menubuhkan syarikat di Malaysia.",
      section: "Mulakan dengan rancangan operasi.",
      body: "Struktur yang sesuai bergantung pada kegiatan, pemilikan, cara keputusan dibuat dan rancangan serantau. Kami membantu menjelaskan perkara tersebut sebelum menyelaras perbincangan dengan pakar bebas dalam urusan korporat, undang-undang atau cukai.",
      points: ["Tetapkan kegiatan, pelanggan dan cadangan pemilikan.", "Senaraikan maklumat untuk perbincangan pemerbadanan.", "Bezakan tugas penyelarasan daripada nasihat undang-undang, cukai dan kawal selia."],
      boundary: "Suruhanjaya Syarikat Malaysia dan pihak berkuasa berkaitan menentukan keputusan pendaftaran dan kawal selia. Kami menyelaras maklumat, bukan memberi nasihat undang-undang atau cukai.",
    },
    "/pvip": {
      eyebrow: "Program Visa Premium",
      title: "Semak syarat PVIP yang diterbitkan sebelum membuat keputusan.",
      lead: "Kami membantu anda memahami maklumat program untuk orang awam dan menyediakan soalan kepada penasihat imigresen bebas.",
      section: "Semak maklumat program terkini.",
      body: "Peraturan program, kriteria kelayakan dan proses permohonan boleh berubah. Semak maklumat terkini daripada pihak berkuasa Malaysia yang berkaitan dan tanya penasihat bebas yang berkelayakan tentang keadaan anda.",
      points: ["Sahkan kriteria semasa dan bukti sokongan yang dinyatakan.", "Bincangkan keadaan anda dengan profesional imigresen bebas.", "Tentukan sendiri sama ada mahu meneruskan permohonan."],
      boundary: "Meridian Malaysia bukan pihak berkuasa imigresen atau firma guaman. Kami tidak menentukan kelayakan atau menjanjikan visa, pemastautin atau kelulusan.",
    },
    "/mm2h": {
      eyebrow: "Malaysia Rumah Keduaku",
      title: "Bandingkan maklumat MM2H semasa dengan rancangan anda.",
      lead: "Kami membantu menyusun persoalan tentang rancangan tinggal jangka panjang dan menyelaras nasihat bebas jika sesuai.",
      section: "Syarat bergantung pada keadaan anda.",
      body: "Kategori MM2H, syarat kewangan dan keperluan pentadbiran boleh berubah. Semak syarat semasa yang diterbitkan dan berbincang dengan profesional bebas sebelum membuat keputusan kewangan atau perpindahan.",
      points: ["Kenal pasti kategori dan tempoh yang ingin ditanya.", "Semak syarat kewangan dan dokumen sokongan yang diterbitkan.", "Bincangkan kesesuaian peribadi dengan penasihat bebas."],
      boundary: "Kami hanya menyediakan maklumat dan penyelarasan. Kami tidak bersekutu dengan pentadbir program dan tidak menjanjikan kelayakan atau kelulusan.",
    },
    "/banking": {
      eyebrow: "Persediaan perbankan",
      title: "Hadir ke perbincangan bank dengan profil perniagaan yang jelas.",
      lead: "Kami membantu menyusun maklumat yang mungkin diminta oleh institusi kewangan sebelum anda menghubunginya.",
      section: "Setiap institusi membuat keputusan sendiri.",
      body: "Bank menetapkan keperluan akaun, pendaftaran pelanggan, usaha wajar dan penerimaan masing-masing. Persediaan boleh menjelaskan kegiatan perniagaan dan kegunaan yang dirancang, tetapi tidak menggantikan penilaian bank.",
      points: ["Terangkan kegiatan, pemilikan dan negara operasi perniagaan.", "Huraikan urus niaga yang dijangka dan tujuan akaun.", "Tanya setiap institusi tentang dokumen dan proses semasanya."],
      boundary: "Kami tidak mewakili bank, memberi nasihat kewangan atau menjanjikan pengenalan, akaun mahupun kelulusan.",
    },
    "/market-entry": {
      eyebrow: "Kemasukan pasaran",
      title: "Uji andaian di sebalik rancangan pasaran Malaysia anda.",
      lead: "Kami membantu perniagaan menyusun kajian awal dan mengenal pasti persoalan tempatan yang memerlukan jawapan langsung.",
      section: "Bina gambaran awal pasaran yang berguna.",
      body: "Rancangan kemasukan yang praktikal bermula dengan pelanggan, cara mencapai pasaran dan model operasi. Kami membantu mengenal pasti kekurangan kajian dan menyelaras perbincangan dengan penyedia perkhidmatan bebas jika sesuai.",
      points: ["Tentukan pelanggan sasaran dan cara untuk menghubungi mereka.", "Senaraikan persoalan operasi, pengambilan pekerja, bekalan dan rakan niaga tempatan.", "Kenal pasti perkara yang memerlukan kajian tempatan atau nasihat profesional."],
      boundary: "Penyelarasan kemasukan pasaran bukan pengganti nasihat undang-undang, cukai, kewangan atau kawal selia. Keputusan dan hasil kekal pada anda serta pihak berkuasa berkaitan.",
    },
  },
  zh: {
    "/company-setup": {
      eyebrow: "公司设立",
      title: "根据业务实际需要选择公司架构。",
      lead: "我们协助创办人整理在马来西亚设立公司时涉及的决策和本地问题。",
      section: "先明确运营计划。",
      body: "合适的架构取决于经营活动、股权、决策方式和区域计划。我们协助厘清这些事项，再协调与独立公司秘书、法律或税务专业人士的沟通。",
      points: ["明确拟开展的业务、客户和股权安排。", "整理讨论公司注册时需要的信息。", "区分协调事项与法律、税务及监管意见。"],
      boundary: "马来西亚公司委员会及相关主管机关决定注册和监管结果。我们协调信息，不提供法律或税务建议。",
    },
    "/pvip": {
      eyebrow: "高级签证计划",
      title: "决定是否申请前，先核对已公布的 PVIP 要求。",
      lead: "我们协助您了解面向公众的项目信息，并准备问题咨询独立移民顾问。",
      section: "核实目前的项目信息。",
      body: "项目规则、资格条件和申请流程可能变化。请先查阅马来西亚相关主管机关公布的最新信息，再向合资格的独立顾问咨询其如何适用于您的情况。",
      points: ["确认目前公布的条件和所需证明材料。", "向独立移民专业人士说明您的情况。", "自行决定是否继续申请。"],
      boundary: "Meridian Malaysia 不是移民主管机关或律所。我们不判断申请资格，也不承诺签证、居留或审批结果。",
    },
    "/mm2h": {
      eyebrow: "马来西亚第二家园",
      title: "结合个人计划了解目前的 MM2H 信息。",
      lead: "我们协助整理长期居留规划问题，并在适当时协调独立专业意见。",
      section: "具体要求因人而异。",
      body: "MM2H 类别、财务条件和行政要求可能变化。作出财务或迁居决定前，请查看目前公布的条件，并咨询独立专业人士。",
      points: ["确定您想了解的类别和时间安排。", "核对目前公布的财务条件和证明材料要求。", "向独立顾问咨询个人情况是否适合。"],
      boundary: "我们仅提供信息和协调，不隶属于项目管理机构，也不承诺资格或审批结果。",
    },
    "/banking": {
      eyebrow: "银行沟通准备",
      title: "带着清晰的业务资料与银行沟通。",
      lead: "我们协助您在联系银行前整理金融机构可能询问的信息。",
      section: "每家机构独立作出决定。",
      body: "银行自行制定开户、客户审核、尽职调查和接纳条件。提前准备有助于说明业务和预期用途，但不能代替银行的审核。",
      points: ["说明业务活动、股权结构和经营国家。", "概述预期交易以及账户用途。", "向各银行核实其当前所需文件和流程。"],
      boundary: "我们不代表银行，不提供财务建议，也不承诺引荐、开户或审批结果。",
    },
    "/market-entry": {
      eyebrow: "市场进入",
      title: "检视您对马来西亚市场的关键假设。",
      lead: "我们协助企业安排早期调研，并找出需要本地直接答复的问题。",
      section: "先绘制一份实用的市场概览。",
      body: "实际的市场进入计划应从客户、市场渠道和运营模式开始。我们协助找出调研缺口，并在适当时协调与独立服务机构沟通。",
      points: ["确定目标客户以及接触客户的方式。", "列出本地运营、招聘、供应和合作伙伴问题。", "找出仍需本地调研或专业建议的事项。"],
      boundary: "市场进入协调不能替代法律、税务、财务或监管建议。业务决策和结果由您及相关主管机关负责。",
    },
  },
};
