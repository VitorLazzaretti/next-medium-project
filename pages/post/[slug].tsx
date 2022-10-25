import { GetStaticProps } from 'next';
import React, { useState } from 'react';
import Header from '../../components/Header';
import { sanityClient, urlFor } from '../../sanity';
import { Post } from '../../typing';
import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";
import Head from 'next/head';

interface Props {
  post: Post,
}

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

const Post = ({ post }: Props) => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<IFormInput>();

  const onSubmitForm: SubmitHandler<IFormInput> = async (data) => {
    await fetch('/api/create_comment', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((data) => {
      setSubmitted(true);
      console.log(data);
    }).catch(err => {
      setSubmitted(false);
      console.log(err);
    });
  }

  return (
    <main>
      <Head>
        <title> {post.title} </title>
      </Head>
      <Header />

      <img
        className='w-full h-40 object-cover object-center'
        src={urlFor(post.mainImage).url()}
        alt='' />

      <article className='max-w-3xl mx-auto p-5'>
        <h1 className='text-3xl mt-10 mb-3'>{post.title}</h1>
        <h2 className='text-xl font-light text-gray-500 mb-2'>{post.description}</h2>
        <div className='flex items-center space-x-2'>
          <img
            className='h-10 w-10 rounded-full object-cover'
            src={urlFor(post.author.image).url()}
            alt=''
          />
          <p className='font-extralight text-sm'>
            Blog post by <span className='text-green-600'>{post.author.name}</span> at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div className='mt-10'>
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className='text-2xl font-bold my-5' {...props} />
              ),
              h2: (props: any) => (
                <h2 className='text-xl font-bold my-5' {...props} />
              ),
              li: ({ children }: any) => (
                <li className='text-2xl font-bold my-5'> {children} </li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className='text-2xl font-bold my-5'>
                  {children}
                </a>
              ),
              image: (props: any) => (
                <img className='p-2' src={urlFor(props).url()} />
              )
            }}
          />
        </div>
      </article>
      <hr className='max-w-lg my-5 mx-auto border border-yellow-500' />

      {!submitted ? (
        <form onSubmit={handleSubmit(onSubmitForm)} className='flex flex-col p-5 max-w-2xl mx-auto mb-10'>
          <h3 className='text-sm text-yellow-500'> Enjoyed this article? </h3>
          <h4 className='text-3xl font-bold'> Leave a comment below! </h4>
          <hr className='py-3 my-2' />

          <input
            {...register("_id")}
            type="hidden"
            name='_id'
            value={post._id}
          />

          <label className='block mb-5 '>
            <span className='text-gray-700'> Name </span>
            <input
              {...register("name", { required: true })}
              className='shadow border focus:ring rounded outline-none py-2 px-3 form-input mt-1 block w-full ring-yellow-500'
              placeholder='John Doe'
              type="text"
            />
          </label>
          <label className='block mb-5 '>

            <span className='text-gray-700'> Email </span>
            <input
              {...register("email", { required: true })}
              className='shadow border focus:ring rounded outline-none py-2 px-3 form-input mt-1 block w-full ring-yellow-500'
              placeholder='example@hotmail.com' type="text"
            />
          </label>
          <label className='block mb-5 '>
            <span className='text-gray-700'> Comment </span>
            <textarea
              {...register("comment", { required: true })}
              className='shadow border focus:ring rounded outline-none py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500'
              placeholder='Enter some long text here'
              rows={8}
            />
          </label>

          <div className='flex flex-col p-5'>
            {errors.name && (
              <span className='text-red-500'>- The Name Field is Required</span>
            )}
            {errors.email && (
              <span className='text-red-500'>- The Email Field is Required</span>
            )}
            {errors.comment && (
              <span className='text-red-500'>- The Comement Field is Required</span>
            )}
          </div>

          <input
            className="shadow bg-yellow-500 font-bold py-2 px-4 rounded cursor-pointer
          hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white"
            type='submit'
          />
        </form>
      ) : (
        <div className='flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto'>
          <h3 className='text-2xl font-bold'>Thank you for submitting your comment!</h3>
          <p className='text-sm'> Once it has been approved, it will appear below!</p>
        </div>
      )}

      <div className='flex flex-col p-10 my-10 w-11/12 max-w-2xl mx-auto shadow-yellow-500 shadow
      space-y-2'
      >
        <h3 className='text-4xl'>Comments</h3>
        <hr className='pb-2' />
        {post.comments.map((comment) => (
          <div
            key={comment._id}
          >
            <p>
              <span className='text-yellow-500'>{comment.name}: </span>
              <span>{comment.comment}</span>
            </p>
          </div>
        ))}
      </div>

    </main>
  )
}

export default Post;

export const getStaticPaths = async () => {
  const query = `
    *[_type == "post"] {
      _id,
      slug {
        current
      }
    }
  `;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current
    }
  }));

  return {
    paths,
    fallback: "blocking"
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    _createdAt,
    title,
    author -> {
      name,
      image
    },
    "comments": *[
      _type == "comment" &&
      post._ref == ^._id
    ],
    description,
    mainImage,
    slug,
    body
  }
  `;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug
  });

  if (!post) {
    return { notFound: true };
  }

  return {
    props: {
      post: post
    },
    revalidate: 60, // after 60 seconds, we will get a new cached page
  };
}