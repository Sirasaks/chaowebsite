"use client";

import { useRef, useState, useEffect } from "react";

// Scroll Reveal Hook
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

// Browser Mockup SVG Component
function BrowserMockup({ imageSrc }: { imageSrc: string }) {
    return (
        <svg
            width="1203"
            height="753"
            viewBox="0 0 1203 753"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        >
            <g clipPath="url(#path0)">
                <path
                    d="M0 52H1202V741C1202 747.627 1196.63 753 1190 753H12C5.37258 753 0 747.627 0 741V52Z"
                    className="fill-[#E5E5E5] dark:fill-[#404040]"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 12C0 5.37258 5.37258 0 12 0H1190C1196.63 0 1202 5.37258 1202 12V52H0L0 12Z"
                    className="fill-[#E5E5E5] dark:fill-[#404040]"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.06738 12C1.06738 5.92487 5.99225 1 12.0674 1H1189.93C1196.01 1 1200.93 5.92487 1200.93 12V51H1.06738V12Z"
                    className="fill-white dark:fill-[#262626]"
                />
                {/* Window buttons */}
                <circle cx="27" cy="25" r="6" className="fill-[#E5E5E5] dark:fill-[#404040]" />
                <circle cx="47" cy="25" r="6" className="fill-[#E5E5E5] dark:fill-[#404040]" />
                <circle cx="67" cy="25" r="6" className="fill-[#E5E5E5] dark:fill-[#404040]" />
                {/* URL bar */}
                <path
                    d="M286 17C286 13.6863 288.686 11 292 11H946C949.314 11 952 13.6863 952 17V35C952 38.3137 949.314 41 946 41H292C288.686 41 286 38.3137 286 35V17Z"
                    fill="#F5F5F5"
                />
                {/* Lock icon */}
                <g className="mix-blend-luminosity">
                    <path
                        d="M566.269 32.0852H572.426C573.277 32.0852 573.696 31.6663 573.696 30.7395V25.9851C573.696 25.1472 573.353 24.7219 572.642 24.6521V23.0842C572.642 20.6721 571.036 19.5105 569.348 19.5105C567.659 19.5105 566.053 20.6721 566.053 23.0842V24.6711C565.393 24.7727 565 25.1917 565 25.9851V30.7395C565 31.6663 565.418 32.0852 566.269 32.0852ZM567.272 22.97C567.272 21.491 568.211 20.6785 569.348 20.6785C570.478 20.6785 571.423 21.491 571.423 22.97V24.6394L567.272 24.6458V22.97Z"
                        fill="#A3A3A3"
                    />
                </g>
                {/* URL text */}
                <g className="mix-blend-luminosity">
                    <text x="580" y="30" fill="#A3A3A3" fontSize="12" fontFamily="Arial, sans-serif">
                        https://acme.ai
                    </text>
                </g>
                {/* Content image placeholder */}
                <image
                    href={imageSrc}
                    width="1200"
                    height="700"
                    x="1"
                    y="52"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#roundedBottom)"
                />
            </g>
            <defs>
                <clipPath id="path0">
                    <rect width="1203" height="753" fill="white" />
                </clipPath>
                <clipPath id="roundedBottom">
                    <path
                        d="M1 52H1201V741C1201 747.075 1196.08 752 1190 752H12C5.92486 752 1 747.075 1 741V52Z"
                        fill="white"
                    />
                </clipPath>
            </defs>
        </svg>
    );
}

const features = [
    {
        title: "ระบบชำระเงินอัตโนมัติ",
        description: "รองรับการชำระเงินหลายช่องทาง ทั้งซองอั่งเปา TrueMoney และระบบ Verify Slip อัตโนมัติ ยืนยันการชำระเงินได้ทันที",
        hoverColor: "hover:bg-red-500/10",
        image: "/dashboard.png",
    },
    {
        title: "ปรับแต่งธีมได้อิสระ",
        description: "ตกแต่งหน้าเว็บไซต์ได้ตามต้องการ เปลี่ยนสี โลโก้ และ Banner ได้ง่าย ไม่ต้องเขียนโค้ด สร้างแบรนด์ที่เป็นเอกลักษณ์ของคุณ",
        hoverColor: "hover:bg-blue-500/10",
        image: "/dashboard.png",
    },
    {
        title: "รองรับสินค้าหลายประเภท",
        description: "ขายสินค้าแบบไอดี/รหัสส่งอัตโนมัติ หรือสินค้าแบบกรอกข้อมูลที่ต้องดำเนินการเอง ยืดหยุ่นตามรูปแบบธุรกิจของคุณ",
        hoverColor: "hover:bg-green-500/10",
        image: "/dashboard.png",
    },
];

export function FeaturesSection() {
    const featuresSection = useScrollReveal();

    return (
        <section className="py-24 bg-card" ref={featuresSection.ref}>
            <div className="mx-auto max-w-7xl px-6">
                {/* Section Heading */}
                <div className={`text-center mb-16 transition-all duration-700 ${featuresSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <h2 className="text-3xl font-bold text-foreground">ทำไมต้องเลือกเรา</h2>
                    <p className="mt-3 text-lg text-muted-foreground">ฟีเจอร์ครบครันที่จะช่วยให้ธุรกิจของคุณเติบโต</p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group relative items-start overflow-hidden bg-neutral-50 dark:bg-neutral-800 p-6 rounded-2xl ${feature.hoverColor} transition-all duration-500 ease-out h-80 ${index === features.length - 1 ? 'md:col-span-2' : ''}`}
                            style={{
                                opacity: featuresSection.isVisible ? 1 : 0,
                                transform: featuresSection.isVisible ? 'none' : 'translateY(20px)',
                                transitionDelay: `${index * 100}ms`,
                            }}
                        >
                            <div>
                                {/* Title */}
                                <h3 className="font-semibold mb-2 text-primary">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-foreground">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Browser Mockup */}
                            <BrowserMockup imageSrc={feature.image} />

                            {/* Bottom Gradient Fade */}
                            <div className="absolute bottom-0 left-0 h-32 w-full bg-linear-to-t from-neutral-50 dark:from-neutral-900 pointer-events-none" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
