export const blankPreset = {
  title: "New Custom Booklet",
  theme: {
    bgCream: "#f4eedb",
    navyDark: "#122230",
    tealAccent: "#005f73",
    charcoal: "#2b2b2b",
    bgImage: "",
    titleFont: "'Cinzel', serif"
  },
  pages: [
    {
      id: "page-1",
      type: "cover",
      title: "BOOKLET TITLE",
      subtitle: "EVENT SUBTITLE / 2027",
      dateLocation: "Date & Event Location",
      tagline: "\"Welcome to Our Event\"",
      emblemText: "[ Logo / Emblem ]",
      emblemImg: "",
      topBarColor: "#005f73",
      bottomBannerStyle: "torn",
      bottomBannerText: "JOIN US FOR AN UNFORGETTABLE PROGRAM",
      bgImage: "",
      scrollworkFrame: true,
      vAlign: "space-between",
      blocks: []
    },
    {
      id: "page-2",
      type: "schedule",
      title: "Sequence of Events",
      items: [
        { time: "5:00 PM", title: "Doors Open", details: "Welcome & Check-in" },
        { time: "6:00 PM", title: "Opening Program", details: "Welcome Ceremony" },
        { time: "7:00 PM", title: "Dinner Service", details: "Main Event" },
        { time: "8:30 PM", title: "Closing Remarks", details: "Farewell" }
      ],
      blocks: []
    },
    {
      id: "page-3",
      type: "custom",
      title: "About Our Organization",
      content: "Add your customized content, story, background history, or announcements here. This engine supports dynamic page generation, content block layers, and center-fold print imposition.",
      blocks: [
        { id: "b1", type: "heading", text: "Custom Subheading Block" },
        { id: "b2", type: "paragraph", text: "You can freely add, remove, and reorder text blocks, image blocks, and dividers on any page!" }
      ]
    },
    {
      id: "page-4",
      type: "backCover",
      organization: "ORGANIZATION / HOST NAME",
      subOrganization: "District / Council / Region",
      qrText: "Scan to view event details online.",
      qrImg: "",
      sponsorsText: "Thank You To Our Sponsors:",
      sponsors: ["Sponsor Alpha", "Sponsor Beta", "Sponsor Gamma", "Sponsor Delta"],
      bottomBannerStyle: "torn",
      bottomBannerText: "THANK YOU FOR YOUR SUPPORT",
      blocks: []
    }
  ]
};

export default blankPreset;
