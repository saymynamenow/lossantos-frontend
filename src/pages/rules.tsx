import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import NavigationBar from "./components/NavigationBar";

// Component to handle markdown-style links
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  const parseText = (text: string) => {
    // Regex to match [text](url) format
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          {match[1]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return <span>{parseText(text)}</span>;
};

const Rules: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"en" | "id">("en");

  const translations = {
    en: {
      title: "((Community Rules))",
      subtitle:
        "Community Guidelines for In-Character and Out-of-Character JGVRP",
      welcome: {
        title: "Welcome to Los Santos Media!",
        description:
          "This is a IC (IN-CHARACTER) Social Media Platform Los Santos-based Social Media on the JGVRP (Jogja Gamers V Reality Roleplay) Server. Everything on this website is for IC (IN-CHARACTER) purposes only. Anything that is not related to IC (IN-CHARACTER) is considered OOC (OUT-OF-CHARACTER). We are not responsible for any OOC (OUT-OF-CHARACTER) content posted on this website, and any content related to OOC will be dealt with according to the existing rules. Our community thrives when everyone feels safe, respected, and valued. These rules help us maintain a positive environment where creativity, meaningful relationships, and authentic sharing can thrive. By using our platform, you agree to follow these guidelines.",
      },
      rules: [
        {
          id: 1,
          title: "Server Character Requirement",
          description:
            "Players whose characters are not registered or present on the server will have their accounts suspended until they are verified. Therefore, a screenshot of your In-Character (IC) ID-Card is required to access features on this website.",
          icon: "📇",
        },
        {
          id: 2,
          title: "No IRL or Powergaming Posts",
          description:
            "Posting content related to real-life (IRL) topics is strictly prohibited on this platform. Any IRL content will be DELETED.\n\nAn exception is made for memes from the internet, as long as they do not involve or reference any members of this community.",
          icon: "🚷",
        },
        {
          id: 3,
          title: "Sensitive Roleplay Content",
          description:
            "Posting content involving Sensitive Roleplay (Erotic, Sexual, Harassment, or Abuse) is strictly prohibited, in accordance with JGVRP Rule No. 7 (Sensitive Content).\n\nFor Erotic Roleplay, posting is entirely up to the player, provided it's based on full consent and awareness, without pressure from others.\n\nIf posting erotic content of someone else, **explicit permission** from that person is required.\n\nIf someone uploads erotic content without permission, the affected party has the right to report the violation via the [JGVRP Forum](https://jogjagamers.org/forum/731-player-report/).",
          icon: "⚠️",
        },
        {
          id: 4,
          title: "Character Manipulation",
          description:
            "Using third-party applications like Menyoo or similar tools to manipulate your In-Character (IC) condition is strictly forbidden.\nExamples include illegally adding money, weapons, or properties your character does not possess.\nSuch actions are a violation of Powergaming Rule (Rule No. 23) and will be sanctioned accordingly.",
          icon: "🛑",
        },
        {
          id: 5,
          title: "Accurate In-Character Content",
          description:
            "All uploaded content must serve an In-Character (IC) purpose and reflect the actual reality of the JGVRP server.\nAll posts are considered IC and are the responsibility of the IC character involved.\nIf a post is found to be inconsistent with server reality, it will be removed by moderators.",
          icon: "📌",
        },
        {
          id: 6,
          title: "Character Kill (CK) Restrictions",
          description:
            "Accounts of characters who have undergone a Character Kill (CK) are not allowed to post as friends, family, or anyone related to that character. After a CK, all relationships of that character are permanently terminated in the IC storyline.",
          icon: "🪦",
        },
        {
          id: 7,
          title: "SARA (Discriminatory Content)",
          description:
            "According to Rule #20 on [JGVRP](https://jogjagamers.org/topic/282880-server-rules/#pasal-20), players are prohibited from mocking or insulting SARA (Ethnicity, Religion, Race, and Inter-group relations).\nHowever, exceptions are allowed if the context is purely IC (In-Character), **excluding any religious elements**, which are not permitted.",
          icon: "🚫",
        },
        {
          id: 8,
          title: "Edited Content Guidelines",
          description:
            "Using tools like Menyoo or other third-party apps to manipulate characters is not allowed. However, editing images or screenshots taken within the JGVRP server using Photoshop or similar tools is allowed, as long as it doesn't distort IC reality or conditions illegally.",
          icon: "🖼️",
        },
      ],
      moderatorList: {
        title: "Moderator List",
        description:
          "Meet our dedicated moderators who help maintain our community standards",
        moderators: [
          {
            name: "Efren Bolster",
            role: "Head Moderator",
            speciality: "Community Management",
            avatar: "👨‍💼",
          },
          {
            name: "Sarah Chen",
            role: "Content Moderator",
            speciality: "Content Review & Safety",
            avatar: "👩‍🔬",
          },
          {
            name: "Mike Rodriguez",
            role: "Technical Moderator",
            speciality: "Technical Support",
            avatar: "👨‍💻",
          },
          {
            name: "Emma Thompson",
            role: "Community Moderator",
            speciality: "User Relations",
            avatar: "👩‍🎓",
          },
        ],
      },
      contact: {
        title: "Questions or Concerns?",
        description:
          "If you have questions about these rules or need to report a violation, our community team is here to help. We're committed to maintaining a safe and welcoming environment for everyone.",
        contactSupport: "Contact Support",
        reportViolation: "Report a Violation",
        // Add a link to Google
        google: "Go to Google",
      },
      footer:
        "These rules were last updated on January 1, 2025. We reserve the right to update these guidelines as our community grows and evolves.",
    },
    id: {
      title: "((Aturan Komunitas))",
      subtitle: "Panduan untuk komunitas yang aman dan positif",
      welcome: {
        title: "Selamat datang di Los Santos Media!",
        description:
          "Ini adalah media sosial berbasis Los Santos yang digunakan di Server JGVRP (Jogja Gamers V Reality Roleplay). Segala sesuatu di dalam situs web ini sepenuhnya untuk keperluan IC (IN-CHARACTER). Segala hal yang tidak berkaitan dengan IC (IN-CHARACTER) dianggap sebagai OOC (OUT-OF-CHARACTER). Kami tidak bertanggung jawab atas konten OOC (OUT-OF-CHARACTER) yang diposting di situs ini, dan semua konten yang berkaitan dengan OOC akan ditindak sesuai dengan peraturan yang berlaku.Komunitas kami akan berkembang dengan baik ketika setiap orang merasa aman, dihargai, dan dihormati. Aturan-aturan ini dibuat untuk menjaga lingkungan yang positif, tempat di mana kreativitas, hubungan yang bermakna, dan berbagi secara autentik dapat berkembang. Dengan menggunakan platform ini, Anda setuju untuk mengikuti pedoman tersebut.",
      },
      rules: [
        {
          id: 1,
          title: "Realitas yang ada",
          description:
            "Player yang karakter nya tidak terdaftar di dalam server/Tidak ada di server, akun nya akan kami suspend sampai player tersebut ada/terdaftar di dalam server. Maka dari itu kami memerlukan screenshoot dari ID-Card (In-Character) kalian untuk bisa mengakses fitur di dalam website ini.",
          icon: "📇",
        },
        {
          id: 2,
          title: "Powergaming In-Game",
          description:
            "Tidak diperkenankan untuk posting hal yang berkaitan dengan IRL (in real life) sama sekali di platform ini, pelanggaran pembuatan post dengan IRL (in real life) content, post tersebut akan kami DELETE.\n Namun ada pengecualian untuk postingan yang berkaitan dengan MEME yang ada di internet, hal tersebut bisa di posting bisa di platform ini, asalkan tidak berkaitan dengan orang yang ada di komunitas ini.",
          icon: "🚷",
        },
        {
          id: 3,
          title: "Konten Sensitif (Sensitive Roleplay)",
          description:
            "Dilarang memposting aktivitas yang berkaitan dengan Sensitive Roleplay (Konten Erotis, Seksual, Pelecehan, dan Kekerasan), sesuai dengan Peraturan No. 7 JGVRP (Sensitive Content).\n\nUntuk konten yang bersifat Erotic Roleplay, keputusan untuk mempostingnya sepenuhnya berada di tangan pemain yang bersangkutan, dengan catatan dilakukan atas persetujuan pribadi dan sadar diri tanpa adanya paksaan dari pihak manapun.\n\nJika yang bersangkutan ingin memposting foto erotic orang lain maka orang tersebut harus mendapatkan izin dari orang yang bersangkutan dahulu\n\nJika dan hanya jika ada seseorang yang memposting foto erotic tanpa sepengetahuan orang yang bersangkutan, maka orang yang bersangkutan berhak untuk melaporkan pelanggaran tersebut di [forum JGVRP](https://jogjagamers.org/forum/731-player-report/)",
          icon: "⚠️",
        },
        {
          id: 4,
          title: "Manipulasi Karakter",
          description:
            "Dilarang keras menggunakan aplikasi pihak ketiga seperti Menyoo dan sejenisnya untuk memanipulasi kondisi karakter In-Character (IC) Anda.\nContohnya termasuk, seperti menambahkan uang, senjata, atau properti secara tidak sah yang tidak dimiliki oleh karakter IC Anda.\nTindakan seperti ini merupakan pelanggaran terhadap aturan Powergaming (Peraturan No. 23) dan akan dikenakan sanksi sesuai dengan ketentuan yang berlaku.",
          icon: "🛑",
        },
        {
          id: 5,
          title: "Konten Akurat",
          description:
            "Setiap konten yang diunggah harus bertujuan untuk keperluan IC (In-Character) dan mencerminkan realitas yang ada di dalam server JGVRP.\nSemua konten yang diposting bersifat IC, dan segala konsekuensinya menjadi tanggung jawab karakter IC yang terlibat.\nJika ditemukan konten yang tidak sesuai dengan realitas server, maka konten tersebut akan dihapus oleh moderator.",
          icon: "📌",
        },
        {
          id: 6,
          title: "Character Kill",
          description:
            "Akun yang telah melakukan Character Kill (CK) tidak diperbolehkan untuk memposting sebagai keluarga, teman, atau memiliki keterkaitan dengan karakter yang telah di-CK.Setelah CK, hubungan karakter tersebut dianggap selesai secara permanen dalam alur cerita (IC).",
          icon: "🪦",
        },
        {
          id: 7,
          title: "SARA",
          description:
            "Sesuai rules#20 pada [JGVRP](https://jogjagamers.org/topic/282880-server-rules/#pasal-20), Player tidak diperbolehkan mengejek dan/atau menjelek-jelekan SARA. Namun ada pengecualian jika itu tujuan nya adalah IC (in-character) itu diperbolehkan namun tidak diperkenankan untuk menambahkan unsur AGAMA disana.",
          icon: "🚫",
        },
        {
          id: 8,
          title: "Konten Editan",
          description:
            "Penggunaan aplikasi seperti Menyoo atau bentuk manipulasi karakter lainnya tidak diperbolehkan. Namun, jika ingin mengedit foto atau gambar yang diambil dari dalam server JGVRP (Jogja Gamers V Reality Roleplay) menggunakan Photoshop atau aplikasi pengeditan sejenis, diperbolehkan, selama tidak mengubah realitas atau kondisi IC karakter secara tidak sah.",
          icon: "🖼️",
        },
      ],
      moderatorList: {
        title: "Daftar Moderator",
        description:
          "Temui moderator yang berdedikasi membantu menjaga standar komunitas kami",
        moderators: [
          {
            name: "Efren Bolster",
            role: "Kepala Moderator",
            speciality: "Manajemen Komunitas",
            avatar: "👨‍💼",
          },
          {
            name: "Sarah Chen",
            role: "Moderator Konten",
            speciality: "Tinjauan Konten & Keamanan",
            avatar: "👩‍🔬",
          },
          {
            name: "Mike Rodriguez",
            role: "Moderator Teknis",
            speciality: "Dukungan Teknis",
            avatar: "👨‍💻",
          },
          {
            name: "Emma Thompson",
            role: "Moderator Komunitas",
            speciality: "Hubungan Pengguna",
            avatar: "👩‍🎓",
          },
        ],
      },
      contact: {
        title: "Pertanyaan atau Kekhawatiran?",
        description:
          "Jika Anda memiliki pertanyaan tentang aturan ini atau perlu melaporkan pelanggaran, tim komunitas kami siap membantu. Kami berkomitmen untuk menjaga lingkungan yang aman dan ramah bagi semua orang.",
        contactSupport: "Hubungi Dukungan",
        reportViolation: "Laporkan Pelanggaran",
        // Add a link to Google
        google: "Kunjungi Google",
      },
      footer:
        "Aturan ini terakhir diperbarui pada 1 Januari 2025. Kami berhak memperbarui panduan ini seiring berkembangnya komunitas kami.",
    },
  };

  const currentTranslation = translations[language];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">🛡️</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentTranslation.title}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {currentTranslation.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === "en"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("id")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  language === "id"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                ID
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              {currentTranslation.welcome.title}
            </h2>
            <p className="text-blue-800 leading-relaxed">
              <MarkdownText text={currentTranslation.welcome.description} />
            </p>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {currentTranslation.rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{rule.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {rule.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <MarkdownText text={rule.description} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Moderator List */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentTranslation.moderatorList.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {currentTranslation.moderatorList.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentTranslation.moderatorList.moderators.map(
              (moderator, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition-colors"
                >
                  <div className="text-4xl mb-3">{moderator.avatar}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {moderator.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-2">
                    {moderator.role}
                  </p>
                  <p className="text-sm text-gray-600">
                    {moderator.speciality}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentTranslation.contact.title}
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {currentTranslation.contact.description}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate("/contact")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {currentTranslation.contact.contactSupport}
              </button>
              <button
                onClick={() => navigate("/report")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {currentTranslation.contact.reportViolation}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">{currentTranslation.footer}</p>
        </div>
      </div>
    </div>
  );
};

export default Rules;
