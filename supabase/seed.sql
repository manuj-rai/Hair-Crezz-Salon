-- Optional starter data. Safe to skip if you'll add via /admin instead.
insert into public.service_categories (name, sort_order) values
  ('Hair',1),
  ('Spa',2),
  ('Skin',3),
  ('Bridal',4),
  ('Nails',5),
  ('Waxing',6)
on conflict (name) do nothing;

insert into public.services (name, category, description, duration_min, price, sort_order) values
  ('Women''s Haircut & Styling','Hair','Consultation, wash, precision cut and blow-dry finish.',60,1200,1),
  ('Men''s Haircut','Hair','Classic or modern cuts tailored to your face shape.',45,600,2),
  ('Global Hair Color','Hair','Single-tone color in your choice of brand and shade.',120,3500,3),
  ('Highlights & Balayage','Hair','Hand-painted highlights for a sun-kissed, dimensional look.',180,5500,4),
  ('Keratin / Smoothening','Hair','Frizz-free, glossy, manageable hair for up to 6 months.',180,6500,5),
  ('Hair Spa & Treatment','Spa','Deep-conditioning ritual with scalp massage.',60,1500,6),
  ('Signature Facial','Skin','Cleanse, exfoliate, mask and massage with premium products.',75,2200,7),
  ('Clean-Up','Skin','Quick refresh: cleanse, scrub, steam and pack.',45,900,8),
  ('Bridal Makeup Trial','Bridal','Trial session to lock in your wedding-day look.',90,4500,9),
  ('Bridal Makeup & Hair','Bridal','HD makeup, hairstyling and draping for your big day.',180,18000,10),
  ('Gel Manicure','Nails','Long-wear gel polish with cuticle care.',60,1200,11),
  ('Full-Body Waxing','Waxing','Roll-on wax with after-care.',90,2500,12);

insert into public.testimonials (author, rating, body, source) values
  ('Ananya R.',5,'Best balayage I have ever had - Aarav understood exactly the dimension I wanted.','Google'),
  ('Karan D.',5,'Rohan''s fades are unmatched. I drive across the city every month for my cut.','Instagram'),
  ('Meera J.',5,'Priya did my bridal hair and makeup - every single guest asked who my artist was.','Google'),
  ('Diya K.',5,'The hair spa is pure bliss. I leave feeling like a new person every time.','Google');

insert into public.gallery_images (url, caption, sort_order) values
  ('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80','Salon interior',1),
  ('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80','Color station',2),
  ('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=80','Bridal styling',3),
  ('https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80','Gent''s grooming',4),
  ('https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80','Cut & finish',5),
  ('https://images.unsplash.com/photo-1559599101-f09722fb4948?w=900&q=80','Highlights',6),
  ('https://kenoshatspa.com/wp-content/uploads/2019/10/kenosha_cosmetology.jpg','Spa',7);
