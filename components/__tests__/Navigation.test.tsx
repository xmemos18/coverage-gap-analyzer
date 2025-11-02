import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../Navigation';

describe('Navigation Component', () => {
  it('should render the logo and navigation links', () => {
    render(<Navigation />);

    // Check logo is present
    expect(screen.getByText('Coverage Gap Analyzer')).toBeInTheDocument();

    // Check desktop navigation links
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
  });

  it('should have correct href attributes on links', () => {
    render(<Navigation />);

    const aboutLink = screen.getAllByRole('link', { name: /about/i })[0];
    const contactLink = screen.getAllByRole('link', { name: /contact/i })[0];

    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('should toggle mobile menu when hamburger button is clicked', () => {
    const { container } = render(<Navigation />);

    // Mobile menu should not be visible initially
    const mobileMenuBefore = container.querySelector('#mobile-menu');
    expect(mobileMenuBefore).not.toBeInTheDocument();

    // Find and click the mobile menu button
    const menuButton = screen.getByRole('button', { name: /open mobile menu/i });
    fireEvent.click(menuButton);

    // Mobile menu should now be visible
    const mobileMenuAfter = container.querySelector('#mobile-menu');
    expect(mobileMenuAfter).toBeInTheDocument();

    // Button text should change
    expect(screen.getByRole('button', { name: /close mobile menu/i })).toBeInTheDocument();
  });

  it('should close mobile menu when link is clicked', () => {
    render(<Navigation />);

    // Open mobile menu
    const openButton = screen.getByRole('button', { name: /open mobile menu/i });
    fireEvent.click(openButton);

    // Verify menu is open
    expect(screen.getByRole('button', { name: /close mobile menu/i })).toBeInTheDocument();

    // Click a link in the mobile menu (we need to find all About links and get the mobile one)
    const aboutLinks = screen.getAllByRole('link', { name: /about/i });
    const mobileAboutLink = aboutLinks[aboutLinks.length - 1]; // Mobile links are rendered after desktop
    fireEvent.click(mobileAboutLink);

    // Menu should close
    expect(screen.getByRole('button', { name: /open mobile menu/i })).toBeInTheDocument();
  });

  it('should have proper ARIA attributes on mobile menu button', () => {
    render(<Navigation />);

    const menuButton = screen.getByRole('button', { name: /open mobile menu/i });

    // Check initial ARIA attributes
    expect(menuButton).toHaveAttribute('aria-label', 'Open mobile menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');

    // Click to open
    fireEvent.click(menuButton);

    // Check updated ARIA attributes
    expect(menuButton).toHaveAttribute('aria-label', 'Close mobile menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should render hamburger icon when menu is closed', () => {
    render(<Navigation />);

    const menuButton = screen.getByRole('button', { name: /open mobile menu/i });
    const svg = menuButton.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('should render X icon when menu is open', () => {
    render(<Navigation />);

    const menuButton = screen.getByRole('button', { name: /open mobile menu/i });
    fireEvent.click(menuButton);

    const closeButton = screen.getByRole('button', { name: /close mobile menu/i });
    const svg = closeButton.querySelector('svg');

    expect(svg).toBeInTheDocument();
  });

  it('should have sticky positioning class', () => {
    const { container } = render(<Navigation />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('sticky');
    expect(nav).toHaveClass('top-0');
  });
});
