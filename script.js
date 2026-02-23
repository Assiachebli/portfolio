document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Reveal animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
    });

    // Mobile Menu Toggle (Basic implementation)
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Check current icon class then swap
            const icon = menuToggle.querySelector('i');
            if (icon.classList.contains('bi-list')) {
                icon.classList.remove('bi-list');
                icon.classList.add('bi-x-lg');
            } else {
                icon.classList.remove('bi-x-lg');
                icon.classList.add('bi-list');
            }
        });
    }

    // Flip Grid Logic
    gsap.registerPlugin(Flip);

    const modal = document.querySelector(".modal");
    const modalContentWrapper = modal.querySelector(".modal-content-wrapper");
    const modalTarget = modal.querySelector(".modal-box-target");
    const modalOverlay = modal.querySelector(".overlay");
    const modalTitle = modal.querySelector(".modal-title");
    const modalType = modal.querySelector(".modal-type");
    const modalDesc = modal.querySelector(".modal-desc");

    const boxes = gsap.utils.toArray(".boxes-container .box");
    const boxesContent = gsap.utils.toArray(".box-content");
    let activeBoxIndex = undefined;

    boxesContent.forEach((box, i) => {
        box.addEventListener("click", () => {
            const state = Flip.getState(box);

            // Re-parenting for Flip
            modalTarget.appendChild(box);
            activeBoxIndex = i;

            // Set Modal Content
            modalTitle.textContent = box.getAttribute('data-title');
            modalType.textContent = box.getAttribute('data-type');
            modalDesc.textContent = box.getAttribute('data-desc');

            // Image Swap Logic
            const modalImg = box.getAttribute('data-modal-img');
            if (modalImg) {
                box.dataset.originalBg = box.style.backgroundImage;
                box.style.backgroundImage = `url(${modalImg})`;
            }

            // Show Modal
            gsap.set(modal, { autoAlpha: 1, visibility: 'visible' });

            Flip.from(state, {
                duration: 0.7,
                ease: "power2.inOut",
                onStart: () => {
                    gsap.to(modalOverlay, { autoAlpha: 1, duration: 0.35 });
                    gsap.to(modalContentWrapper, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.2 });
                }
            });
        });
    });

    const closeModal = () => {
        if (activeBoxIndex === undefined) return;

        const box = modalTarget.querySelector(".box-content");
        const state = Flip.getState(box);

        // Reset background image if swapped
        if (box.dataset.originalBg !== undefined) {
            box.style.backgroundImage = box.dataset.originalBg;
            delete box.dataset.originalBg;
        }

        // Return box to original container
        boxes[activeBoxIndex].appendChild(box);

        gsap.to(modalContentWrapper, { autoAlpha: 0, y: 20, duration: 0.3 });
        gsap.to([modal, modalOverlay], {
            autoAlpha: 0,
            ease: "power2.inOut",
            duration: 0.35,
            onComplete: () => {
                gsap.set(modal, { visibility: 'hidden' });
                activeBoxIndex = undefined;
            }
        });

        Flip.from(state, {
            duration: 0.7,
            ease: "power2.inOut",
            absolute: true
        });
    };

    modalOverlay.addEventListener("click", closeModal);

    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // UI Feedback
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            try {
                console.log('Sending data to contact.php...');
                console.log('Current Location:', window.location.href);

                // Collect data into an object
                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData.entries());

                const response = await fetch('contact.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                console.log('Response Status:', response.status);

                // Check if response is ok
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server Error Text:', errorText);
                    throw new Error(errorText || 'Server error');
                }

                const result = await response.json();
                console.log('Success Result:', result);

                if (result.status === 'success') {
                    formStatus.textContent = result.message;
                    formStatus.classList.add('success');
                    contactForm.reset();
                } else {
                    formStatus.textContent = result.message;
                    formStatus.classList.add('error');
                }
            } catch (error) {
                console.error('FULL Error Object:', error);

                let userMessage = 'Something went wrong. Please try again later.';

                if (window.location.protocol === 'file:') {
                    userMessage = 'ERROR: You are opening index.html directly from your folders. You MUST use http://localhost/portf/';
                } else if (error.message.includes('Failed to fetch')) {
                    userMessage = 'Failed to fetch: Make sure XAMPP Apache is running and you are using http://localhost/portf/';
                } else if (error.message.includes('Unexpected token')) {
                    userMessage = 'Server returned an invalid response. Check your PHP code and MySQL connection.';
                } else {
                    userMessage = error.message;
                }

                formStatus.textContent = userMessage;
                formStatus.classList.add('error');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
