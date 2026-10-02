export const genericPreset = {
  title: "Annual Conference Program Booklet",
  theme: {
    bgCream: "#ffffff",
    navyDark: "#1a252f",
    tealAccent: "#2980b9",
    charcoal: "#333333",
    bgImage: "",
    titleFont: "'Merriweather', serif"
  },
  pages: [
    {
      id: "page-1",
      type: "cover",
      title: "ANNUAL LEADERSHIP SUMMIT",
      subtitle: "Building the Future Together",
      dateLocation: "October 15-17, 2027 • Convention Center",
      tagline: "\"Innovate, Lead, Succeed\"",
      emblemText: "[ Logo ]",
      emblemImg: "",
      topBarColor: "#2980b9",
      bottomBannerStyle: "gold",
      bottomBannerText: "WELCOME DELEGATES & GUESTS",
      bgImage: "",
      blocks: []
    },
    {
      id: "page-2",
      type: "schedule",
      title: "Program Schedule",
      items: [
        { time: "08:30 AM", title: "Registration & Breakfast", details: "Main Lobby" },
        { time: "09:30 AM", title: "Keynote Address", details: "Auditorium A" },
        { time: "11:30 AM", title: "Panel Discussion", details: "Hall B" },
        { time: "01:00 PM", title: "Networking Lunch", details: "Dining Pavilion" }
      ],
      blocks: []
    },
    {
      id: "page-3",
      type: "custom",
      title: "Welcome & Overview",
      content: "Welcome to the 2027 Leadership Summit. This booklet provides full details for sessions, speakers, and events.",
      blocks: []
    },
    {
      id: "page-4",
      type: "backCover",
      organization: "LEADERSHIP COUNCIL",
      subOrganization: "Global Headquarters",
      qrText: "Scan for live agenda updates.",
      qrImg: "",
      sponsorsText: "Sponsors:",
      sponsors: ["Partner Corp", "Global Tech", "Innovate Inc"],
      bottomBannerStyle: "gold",
      bottomBannerText: "THANK YOU FOR ATTENDING",
      blocks: []
    }
  ]
};

export default genericPreset;
