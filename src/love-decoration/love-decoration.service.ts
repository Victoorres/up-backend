import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLoveDecorationDto } from './dto/create-love-decoration.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { UpdateLoveDecorationDto } from './dto/update-love-decoration.dto';

@Injectable()
export class LoveDecorationService {
  constructor(
    private readonly prisma: PrismaService,
    private userService: UserService,
  ) {}

  async create(dto: CreateLoveDecorationDto, userDto: CreateUserDto) {
    const emailExists = await this.userService.checkIfEmailExists(
      userDto.email,
    );
    if (emailExists) {
      throw new ConflictException('Email já cadastrado.');
    }

    const loveDecoration = await this.prisma.loveDecoration.create({
      data: {
        name: dto.name,
        contact: dto.contact,
        instagram: dto.instagram,
        tiktok: dto.tiktok || '',

        address: {
          create: dto.address,
        },
      },
      include: {
        address: true,
      },
    });

    const user = await this.userService.createUserWithRelation(
      userDto,
      undefined,
      undefined,
      loveDecoration.id,
    );

    return { loveDecoration, user };
  }

  async update(id: string, data: UpdateLoveDecorationDto) {
    const { address, ...eventData } = data;

    const prismaUpdateData: any = {
      ...eventData,
    };

    if (address) {
      prismaUpdateData.address = {
        update: {
          state: address.state,
          city: address.city,
          district: address.district,
          street: address.street,
          complement: address.complement,
          number: address.number,
          zipCode: address.zipCode,
        },
      };
    }

    return this.prisma.loveDecoration.update({
      where: { id },
      data: prismaUpdateData,
    });
  }

  async findAll() {
    return this.prisma.loveDecoration.findMany({});
  }

  async findOne(id: string) {
    return this.prisma.loveDecoration.findUnique({
      where: { id },
    });
  }
}
